import { useEffect, useMemo, useState } from 'react'
import {
  createPost,
  deletePost,
  formatRenderReport,
  getPost,
  listCategories,
  previewPost,
  renderSite,
  updatePost,
} from '../api.js'
import { PreviewFrame } from '../components/PreviewFrame.jsx'
import { StatusBanner } from '../components/StatusBanner.jsx'
import { setUnsavedBlocker } from '../router.js'
import { slugFromTitle, todayUtc } from '../slug.js'

const emptyForm = () => ({
  title: '',
  slug: '',
  categorySlug: '',
  publishedOn: todayUtc(),
  excerpt: '',
  published: 0,
  bodyHtml: '',
})

const toForm = (post) => ({
  title: post.title ?? '',
  slug: post.slug ?? '',
  categorySlug: post.categorySlug ?? '',
  publishedOn: post.publishedOn ?? todayUtc(),
  excerpt: post.excerpt ?? '',
  published: post.published === 1 ? 1 : 0,
  bodyHtml: post.bodyHtml ?? '',
})

const snapshot = (form) => JSON.stringify(form)

export const PostEditor = ({ slug, isNew, navigate, setStatus }) => {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(emptyForm)
  const [savedSlug, setSavedSlug] = useState(slug || '')
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState(null)

  const dirty = snapshot(form) !== snapshot(saved)

  useEffect(() => {
    setUnsavedBlocker(() => {
      if (!dirty) {
        return true
      }
      return window.confirm('You have unsaved changes. Leave this page?')
    })
    return () => setUnsavedBlocker(null)
  }, [dirty])

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!dirty) {
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const categoryData = await listCategories()
        if (cancelled) {
          return
        }
        setCategories(categoryData.categories)
        if (isNew) {
          setLoading(false)
          return
        }
        const postData = await getPost(slug)
        if (cancelled) {
          return
        }
        const next = toForm(postData.post)
        setForm(next)
        setSaved(next)
        setSavedSlug(postData.post.slug)
        setSlugTouched(true)
      } catch (err) {
        if (!cancelled) {
          setStatus({ type: 'error', text: err.message })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isNew, slug, setStatus])

  useEffect(() => {
    if (!form.categorySlug) {
      return
    }
    const id = window.setTimeout(() => {
      const fields = {
        title: form.title,
        categorySlug: form.categorySlug,
        excerpt: form.excerpt,
        bodyHtml: form.bodyHtml,
        publishedOn: form.publishedOn,
      }
      if (form.slug) {
        fields.slug = form.slug
      }
      previewPost(fields)
        .then((html) => {
          setPreviewHtml(html)
          setPreviewError(null)
        })
        .catch((err) => {
          setPreviewError(err.message)
        })
    }, 400)
    return () => window.clearTimeout(id)
  }, [
    form.title,
    form.slug,
    form.categorySlug,
    form.publishedOn,
    form.excerpt,
    form.bodyHtml,
  ])

  const patch = (updates) => {
    setForm((current) => {
      const next = { ...current, ...updates }
      if (!slugTouched && updates.title !== undefined) {
        next.slug = slugFromTitle(updates.title)
      }
      return next
    })
  }

  const persist = async (overrides = {}) => {
    const fields = { ...form, ...overrides }
    const data = isNew
      ? await createPost(fields)
      : await updatePost(savedSlug, fields)
    const next = toForm(data.post)
    setForm(next)
    setSaved(next)
    setSavedSlug(data.post.slug)
    setSlugTouched(true)
    return data.post
  }

  const goToSaved = (post) => {
    if (isNew || post.slug !== savedSlug) {
      navigate(`/posts/${post.slug}`, { replace: true, force: true })
    }
  }

  const onSave = async () => {
    setBusy(true)
    try {
      const post = await persist()
      setStatus({ type: 'ok', text: `Saved ${post.slug}` })
      goToSaved(post)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onPublish = async () => {
    setBusy(true)
    try {
      const post = await persist({ published: 1 })
      const report = await renderSite()
      setStatus({
        type: 'ok',
        text: `Published. ${formatRenderReport(report)}`,
        href: `/posts/${post.slug}.html`,
        hrefLabel: 'View published post',
      })
      goToSaved(post)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onUnpublish = async () => {
    setBusy(true)
    try {
      const post = await persist({ published: 0 })
      const report = await renderSite()
      setStatus({
        type: 'ok',
        text: `Unpublished ${post.slug}. ${formatRenderReport(report)}`,
      })
      goToSaved(post)
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm(`Delete “${form.title || form.slug || 'this post'}”?`)) {
      return
    }
    setBusy(true)
    try {
      const wasPublished = saved.published === 1
      await deletePost(savedSlug)
      if (wasPublished) {
        const report = await renderSite()
        setStatus({
          type: 'ok',
          text: `Deleted. ${formatRenderReport(report)}`,
        })
      } else {
        setStatus({ type: 'ok', text: 'Post deleted' })
      }
      navigate('/', { force: true })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const heading = useMemo(
    () => (isNew ? 'New post' : form.title || slug || 'Edit post'),
    [isNew, form.title, slug],
  )

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading post…</p>
      </section>
    )
  }

  return (
    <section className="page editor-page">
      <div className="page-header">
        <h1>{heading}</h1>
        <p className="muted">
          {form.published === 1
            ? 'Published posts are written to the public site on Publish or Generate site.'
            : 'Drafts stay in the database until you publish.'}
        </p>
      </div>

      <form
        className="editor-fields"
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
      >
        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </label>
        <label>
          Slug
          <input
            type="text"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true)
              patch({ slug: event.target.value })
            }}
          />
        </label>
        <label>
          Category
          <select
            value={form.categorySlug}
            onChange={(event) => patch({ categorySlug: event.target.value })}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input
            type="date"
            value={form.publishedOn}
            onChange={(event) => patch({ publishedOn: event.target.value })}
          />
        </label>
        <label className="span-2">
          Excerpt
          <textarea
            className="excerpt"
            rows="3"
            value={form.excerpt}
            onChange={(event) => patch({ excerpt: event.target.value })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.published === 1}
            onChange={(event) => patch({ published: event.target.checked ? 1 : 0 })}
          />
          Published
        </label>
        <div className="form-actions span-2">
          <button type="submit" disabled={busy}>
            Save
          </button>
          {form.published === 1 ? (
            <button type="button" disabled={busy} onClick={onUnpublish}>
              Unpublish
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={onPublish}>
              Publish
            </button>
          )}
          {!isNew && (
            <button type="button" className="danger" disabled={busy} onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </form>

      <div className="editor-split">
        <label className="body-editor">
          Body HTML
          <textarea
            value={form.bodyHtml}
            onChange={(event) => patch({ bodyHtml: event.target.value })}
            spellCheck="false"
          />
        </label>
        <div className="preview-pane">
          <div className="preview-label">Live preview</div>
          <StatusBanner status={previewError ? { type: 'error', text: previewError } : null} />
          {form.categorySlug ? (
            <PreviewFrame html={previewHtml} />
          ) : (
            <p className="muted">Pick a category to preview.</p>
          )}
        </div>
      </div>
    </section>
  )
}
