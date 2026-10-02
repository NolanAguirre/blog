import { useEffect, useState } from 'react'
import { listCategories, listPosts } from '../api.js'

const formatDate = (dateStr) => {
  if (!dateStr) {
    return ''
  }
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const year = Number.parseInt(parts[0], 10)
    const month = Number.parseInt(parts[1], 10) - 1
    const day = Number.parseInt(parts[2], 10)
    const d = new Date(Date.UTC(year, month, day))
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    }
  }
  return dateStr
}

export const PostList = ({ navigate, setStatus }) => {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [postData, categoryData] = await Promise.all([
          listPosts(),
          listCategories(),
        ])
        if (cancelled) {
          return
        }
        setPosts(postData.posts)
        setCategories(categoryData.categories)
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
  }, [setStatus])

  const draftCount = posts.filter((post) => post.published !== 1).length
  const publishedCount = posts.filter((post) => post.published === 1).length

  const visible = posts.filter((post) => {
    if (statusFilter === 'draft' && post.published === 1) {
      return false
    }
    if (statusFilter === 'published' && post.published !== 1) {
      return false
    }
    if (categoryFilter && !(post.categories || []).some((category) => category.slug === categoryFilter)) {
      return false
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const titleMatch = (post.title || '').toLowerCase().includes(q)
      const slugMatch = (post.slug || '').toLowerCase().includes(q)
      if (!titleMatch && !slugMatch) {
        return false
      }
    }
    return true
  })

  return (
    <section className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Posts</h1>
          <span className="page-count-badge">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>
        <button type="button" onClick={() => navigate('/posts/new')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New post
        </button>
      </div>

      <div className="filters">
        <div className="filters-left">
          <div className="filter-group" role="group" aria-label="Status filter">
            <button
              type="button"
              className={statusFilter === 'all' ? 'active' : ''}
              onClick={() => setStatusFilter('all')}
            >
              All ({posts.length})
            </button>
            <button
              type="button"
              className={statusFilter === 'draft' ? 'active' : ''}
              onClick={() => setStatusFilter('draft')}
            >
              Drafts ({draftCount})
            </button>
            <button
              type="button"
              className={statusFilter === 'published' ? 'active' : ''}
              onClick={() => setStatusFilter('published')}
            >
              Published ({publishedCount})
            </button>
          </div>

          <label className="filter-select">
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title or slug…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search posts"
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="app-loading">
          <div className="spinner" />
          <p>Loading posts…</p>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="empty-state">
          <p>
            {posts.length === 0
              ? 'No posts yet. Click "New post" to create your first draft!'
              : 'No posts match your filters.'}
          </p>
          {(statusFilter !== 'all' || categoryFilter || search) && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setStatusFilter('all')
                setCategoryFilter('')
                setSearch('')
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => (
                <tr
                  key={post.slug}
                  className="clickable"
                  onClick={() => navigate(`/posts/${post.slug}`)}
                >
                  <td>
                    <div className="post-title-cell">{post.title}</div>
                    <div className="post-slug-sub">/{post.slug}</div>
                  </td>
                  <td className="category-tags">
                    {(post.categories || []).map((category) => (
                      <span key={category.slug} className="category-tag">{category.name}</span>
                    ))}
                  </td>
                  <td>
                    <span className="date-text">{formatDate(post.publishedOn)}</span>
                  </td>
                  <td>
                    <span className={`badge ${post.published === 1 ? 'badge-published' : 'badge-draft'}`}>
                      <span className="badge-dot" />
                      {post.published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
