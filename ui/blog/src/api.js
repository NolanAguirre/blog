const api = async (path, options = {}) => {
  const headers = { ...options.headers }
  let body = options.body
  if (body !== undefined && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(path, {
    credentials: 'include',
    ...options,
    headers,
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

export const listPosts = () => api('/api/posts')

export const getPost = (slug) => api(`/api/posts/${encodeURIComponent(slug)}`)

export const createPost = (fields) => api('/api/posts', {
  method: 'POST',
  body: fields,
})

export const updatePost = (slug, fields) => api(`/api/posts/${encodeURIComponent(slug)}`, {
  method: 'PUT',
  body: fields,
})

export const deletePost = (slug) => api(`/api/posts/${encodeURIComponent(slug)}`, {
  method: 'DELETE',
})

export const listCategories = () => api('/api/categories')

export const createCategory = (fields) => api('/api/categories', {
  method: 'POST',
  body: fields,
})

export const updateCategory = (slug, fields) => api(`/api/categories/${encodeURIComponent(slug)}`, {
  method: 'PUT',
  body: fields,
})

export const deleteCategory = (slug) => api(`/api/categories/${encodeURIComponent(slug)}`, {
  method: 'DELETE',
})

export const getSettings = () => api('/api/settings')

export const updateSettings = (fields) => api('/api/settings', {
  method: 'PUT',
  body: fields,
})

export const renderSite = () => api('/api/render', { method: 'POST' })

export const getSession = () => api('/auth/session')

export const login = (username, password) => api('/auth/login', {
  method: 'POST',
  body: { username, password },
})

export const logout = () => api('/auth/logout', { method: 'POST' })

export const previewPost = async (fields) => {
  const res = await fetch('/api/preview', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.text()
}

export const formatRenderReport = ({ written = [], deleted = [] }) => {
  const bits = []
  if (written.length > 0) {
    bits.push(`Wrote ${written.join(', ')}`)
  }
  if (deleted.length > 0) {
    bits.push(`Deleted ${deleted.join(', ')}`)
  }
  return bits.join('. ') || 'Site generated (no file changes)'
}
