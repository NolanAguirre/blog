import { useEffect, useState } from 'react'
import { listCategories, listPosts } from '../api.js'

export const PostList = ({ navigate, setStatus }) => {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
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

  const visible = posts.filter((post) => {
    if (statusFilter === 'draft' && post.published === 1) {
      return false
    }
    if (statusFilter === 'published' && post.published !== 1) {
      return false
    }
    if (categoryFilter && post.categorySlug !== categoryFilter) {
      return false
    }
    return true
  })

  return (
    <section className="page">
      <div className="page-header">
        <h1>Posts</h1>
        <button type="button" onClick={() => navigate('/posts/new')}>
          New post
        </button>
      </div>

      <div className="filters">
        <div className="filter-group" role="group" aria-label="Status">
          {[
            ['all', 'All'],
            ['draft', 'Draft'],
            ['published', 'Published'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={statusFilter === value ? 'active' : ''}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </button>
          ))}
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

      {loading && <p className="muted">Loading posts…</p>}

      {!loading && visible.length === 0 && (
        <p className="empty-state">
          {posts.length === 0
            ? 'No posts yet.'
            : 'No posts match these filters.'}
        </p>
      )}

      {!loading && visible.length > 0 && (
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
                <td>{post.title}</td>
                <td>{post.categoryName}</td>
                <td>{post.publishedOn}</td>
                <td>
                  <span className={`badge ${post.published === 1 ? 'badge-published' : 'badge-draft'}`}>
                    {post.published === 1 ? 'Published' : 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
