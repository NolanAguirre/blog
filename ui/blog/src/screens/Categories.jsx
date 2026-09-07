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
      setStatus({ type: 'ok', text: `Saved ${draft.slug}` })
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
      setStatus({ type: 'ok', text: `Deleted ${category.slug}` })
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
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </td>
      <td>{category.postCount}</td>
      <td className="row-actions">
        <button type="button" disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
          Up
        </button>
        <button type="button" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)}>
          Down
        </button>
        <button type="button" disabled={saving} onClick={onSave}>
          Save
        </button>
        <button
          type="button"
          className="danger"
          disabled={category.postCount > 0}
          title={category.postCount > 0 ? 'category still has posts' : 'Delete category'}
          onClick={onDelete}
        >
          Delete
        </button>
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
    setBusy(true)
    try {
      await createCategory({
        slug: draft.slug,
        name: draft.name,
        description: draft.description,
      })
      setDraft(emptyDraft())
      setSlugTouched(false)
      setStatus({ type: 'ok', text: `Added ${draft.slug}. Generate site to update nav.` })
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
      setStatus({ type: 'ok', text: 'Category order updated. Generate site to update nav.' })
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
        <h1>Categories</h1>
        <p className="muted">Nav updates on the next Generate site or publish.</p>
      </div>

      <form className="panel form" onSubmit={onAdd}>
        <h2>Add category</h2>
        <label>
          Name
          <input
            type="text"
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
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <div className="form-actions span-2">
          <button type="submit" disabled={busy}>
            Add
          </button>
        </div>
      </form>

      {loading && <p className="muted">Loading categories…</p>}

      {!loading && (
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
      )}
    </section>
  )
}
