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
  categorySlugs: [],
  publishedOn: todayUtc(),
  excerpt: '',
  published: 0,
  bodyHtml: '',
})

const toForm = (post) => ({
  title: post.title ?? '',
  slug: post.slug ?? '',
  categorySlugs: (post.categories || []).map((category) => category.slug),
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
    if (form.categorySlugs.length === 0) {
      return
    }
    const id = window.setTimeout(() => {
      const fields = {
        title: form.title,
        categorySlugs: form.categorySlugs,
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
    form.categorySlugs,
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
      <section className="page editor-page">
        <div className="app-loading">
          <div className="spinner" />
          <p>Loading post…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page editor-page">
      <div className="editor-action-bar">
        <div className="editor-action-left">
          <button
            type="button"
            className="editor-back-link"
            onClick={() => navigate('/')}
            title="Return to posts list"
          >
            ← Posts
          </button>
          <span className="editor-heading">{heading}</span>
          <span className={`badge ${form.published === 1 ? 'badge-published' : 'badge-draft'}`}>
            <span className="badge-dot" />
            {form.published === 1 ? 'Published' : 'Draft'}
          </span>
          {dirty && (
            <span className="muted" title="Unsaved changes">
              • Unsaved
            </span>
          )}
        </div>

        <div className="editor-action-right">
          <button
            type="button"
            disabled={busy}
            onClick={onSave}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>

          {form.published === 1 ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={onUnpublish}
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onPublish}
            >
              Publish
            </button>
          )}

          {!isNew && (
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={onDelete}
            >
              Delete
            </button>
          )}
        </div>
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
            placeholder="Post title"
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </label>

        <label>
          Slug
          <input
            type="text"
            placeholder="post-url-slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true)
              patch({ slug: event.target.value })
            }}
          />
        </label>

        <div className="checkbox-group">
          <span>Categories</span>
          {categories.map((category) => (
            <label key={category.slug} className="checkbox">
              <input
                type="checkbox"
                checked={form.categorySlugs.includes(category.slug)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...form.categorySlugs, category.slug]
                    : form.categorySlugs.filter((slug) => slug !== category.slug)
                  patch({ categorySlugs: next })
                }}
              />
              {category.name}
            </label>
          ))}
        </div>

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
            placeholder="A short summary for previews and RSS…"
            value={form.excerpt}
            onChange={(event) => patch({ excerpt: event.target.value })}
          />
        </label>

        <label className="checkbox span-2">
          <input
            type="checkbox"
            checked={form.published === 1}
            onChange={(event) => patch({ published: event.target.checked ? 1 : 0 })}
          />
          Published immediately on save
        </label>
      </form>

      <div className="editor-split">
        <div className="body-editor">
          <div className="body-editor-header">
            <span>Body HTML</span>
            <span>HTML / Rich Text</span>
          </div>
          <textarea
            value={form.bodyHtml}
            onChange={(event) => patch({ bodyHtml: event.target.value })}
            spellCheck="false"
            placeholder="Write post content in HTML..."
          />
        </div>

        <div className="preview-pane">
          <div className="preview-pane-header">
            <span>Live preview</span>
            <span>Desktop</span>
          </div>

          <StatusBanner status={previewError ? { type: 'error', text: previewError } : null} />

          {form.categorySlugs.length > 0 ? (
            <PreviewFrame html={previewHtml} />
          ) : (
            <div className="preview-placeholder">
              <p>Select at least one category to render live preview.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
