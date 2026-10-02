import { useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../api.js'
import { slugFromTitle } from '../slug.js'

const emptyDraft = () => ({
  slug: '',
  name: '',
  description: '',
})

const CategoryRow = ({ category, index, total, busy, onMove, onSaved, onDeleted, setStatus }) => {
  const [draft, setDraft] = useState({
    slug: category.slug,
    name: category.name,
    description: category.description ?? '',
  })
  const [saving, setSaving] = useState(false)

  const onSave = async () => {
    setSaving(true)
    try {
      await updateCategory(category.slug, {
        slug: draft.slug,
        name: draft.name,
        description: draft.description,
        sortOrder: category.sortOrder,
      })
      setStatus({ type: 'ok', text: `Saved category "${draft.name}"` })
      onSaved()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm(`Delete category “${category.name}”?`)) {
      return
    }
    try {
      await deleteCategory(category.slug)
      setStatus({ type: 'ok', text: `Deleted category "${category.name}"` })
      onDeleted()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    }
  }

  return (
    <tr>
      <td>
        <input
          type="text"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          value={draft.slug}
          onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
        />
      </td>
      <td>
        <input
          type="text"
          placeholder="Category description"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </td>
      <td>
        <span className="badge badge-count" title={`${category.postCount} posts in this category`}>
          {category.postCount}
        </span>
      </td>
      <td>
        <div className="row-actions">
          <button
            type="button"
            className="secondary btn-sm"
            disabled={busy || index === 0}
            onClick={() => onMove(index, -1)}
            title="Move category up"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="secondary btn-sm"
            disabled={busy || index === total - 1}
            onClick={() => onMove(index, 1)}
            title="Move category down"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="btn-sm"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="danger btn-sm"
            disabled={category.postCount > 0}
            title={category.postCount > 0 ? 'Category has posts and cannot be deleted' : 'Delete category'}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export const Categories = ({ setStatus }) => {
  const [categories, setCategories] = useState([])
  const [draft, setDraft] = useState(emptyDraft)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const data = await listCategories()
    setCategories(data.categories)
  }

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        await load()
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
    start()
    return () => {
      cancelled = true
    }
  }, [setStatus])

  const onAdd = async (event) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.slug.trim()) {
      setStatus({ type: 'error', text: 'Category name and slug are required.' })
      return
    }
    setBusy(true)
    try {
      await createCategory({
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        description: draft.description.trim(),
      })
      setDraft(emptyDraft())
      setSlugTouched(false)
      setStatus({ type: 'ok', text: `Added category "${draft.name}". Generate site to update nav.` })
      await load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onMove = async (index, delta) => {
    const otherIndex = index + delta
    const a = categories[index]
    const b = categories[otherIndex]
    if (!a || !b) {
      return
    }
    setBusy(true)
    try {
      await updateCategory(a.slug, {
        slug: a.slug,
        name: a.name,
        description: a.description,
        sortOrder: b.sortOrder,
      })
      await updateCategory(b.slug, {
        slug: b.slug,
        name: b.name,
        description: b.description,
        sortOrder: a.sortOrder,
      })
      setStatus({ type: 'ok', text: 'Category order updated. Generate site to update navigation.' })
      await load()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Categories</h1>
          <span className="page-count-badge">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
        <p className="muted">Site navigation updates on the next "Generate site" or post publish.</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Add category</h2>
            <div className="panel-description">Create a new category for grouping your blog posts.</div>
          </div>
        </div>

        <form className="form" onSubmit={onAdd}>
          <label>
            Name
            <input
              type="text"
              placeholder="e.g. Technology"
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value
                setDraft((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : slugFromTitle(name),
                }))
              }}
            />
          </label>

          <label>
            Slug
            <input
              type="text"
              placeholder="e.g. technology"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true)
                setDraft({ ...draft, slug: event.target.value })
              }}
            />
          </label>

          <label className="span-2">
            Description
            <input
              type="text"
              placeholder="A brief description of this topic"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>

          <div className="form-actions span-2">
            <button type="submit" disabled={busy}>
              {busy ? 'Adding…' : 'Add category'}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="app-loading">
          <div className="spinner" />
          <p>Loading categories…</p>
        </div>
      )}

      {!loading && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Posts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <CategoryRow
                  key={category.slug}
                  category={category}
                  index={index}
                  total={categories.length}
                  busy={busy}
                  onMove={onMove}
                  onSaved={load}
                  onDeleted={load}
                  setStatus={setStatus}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
