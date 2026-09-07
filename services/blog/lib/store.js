const { httpError } = require('./http')

const POST_SELECT = `
  SELECT
    p.slug,
    p.title,
    p.excerpt,
    p.body_html AS bodyHtml,
    p.published_on AS publishedOn,
    p.published,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt,
    c.slug AS categorySlug,
    c.name AS categoryName
  FROM posts p
  JOIN categories c ON c.id = p.category_id
`

const CATEGORY_SELECT = `
  SELECT
    c.slug,
    c.name,
    c.description,
    c.sort_order AS sortOrder,
    COUNT(p.id) AS postCount
  FROM categories c
  LEFT JOIN posts p ON p.category_id = c.id
`

const wrapConstraint = (fn) => {
  try {
    return fn()
  } catch (err) {
    const message = String(err && err.message ? err.message : err)
    if (message.includes('UNIQUE constraint failed')) {
      throw httpError(409, 'slug already exists')
    }
    throw err
  }
}

const getCategoryId = (db, slug) => {
  const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)
  if (!row) {
    throw httpError(400, 'categorySlug does not exist')
  }
  return row.id
}

const listPosts = (db) => db.prepare(`
  SELECT
    p.slug,
    p.title,
    p.excerpt,
    p.published_on AS publishedOn,
    p.published,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt,
    c.slug AS categorySlug,
    c.name AS categoryName
  FROM posts p
  JOIN categories c ON c.id = p.category_id
  ORDER BY p.updated_at DESC, p.slug
`).all()

const getPost = (db, slug) => db.prepare(`
  ${POST_SELECT}
  WHERE p.slug = ?
`).get(slug) || null

const createPost = (db, fields) => wrapConstraint(() => {
  const categoryId = getCategoryId(db, fields.categorySlug)
  db.prepare(`
    INSERT INTO posts (
      slug, title, category_id, excerpt, body_html, published_on, published
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    fields.slug,
    fields.title,
    categoryId,
    fields.excerpt,
    fields.bodyHtml,
    fields.publishedOn,
    fields.published,
  )
  return getPost(db, fields.slug)
})

const updatePost = (db, slug, fields) => wrapConstraint(() => {
  if (!getPost(db, slug)) {
    return null
  }
  const categoryId = getCategoryId(db, fields.categorySlug)
  db.prepare(`
    UPDATE posts
    SET
      slug = ?,
      title = ?,
      category_id = ?,
      excerpt = ?,
      body_html = ?,
      published_on = ?,
      published = ?,
      updated_at = datetime('now')
    WHERE slug = ?
  `).run(
    fields.slug,
    fields.title,
    categoryId,
    fields.excerpt,
    fields.bodyHtml,
    fields.publishedOn,
    fields.published,
    slug,
  )
  return getPost(db, fields.slug)
})

const deletePost = (db, slug) => {
  const result = db.prepare('DELETE FROM posts WHERE slug = ?').run(slug)
  return result.changes > 0
}

const listCategories = (db) => db.prepare(`
  ${CATEGORY_SELECT}
  GROUP BY c.id
  ORDER BY c.sort_order, c.slug
`).all()

const getCategory = (db, slug) => db.prepare(`
  ${CATEGORY_SELECT}
  WHERE c.slug = ?
  GROUP BY c.id
`).get(slug) || null

const nextSortOrder = (db) => {
  const row = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories').get()
  return row.next
}

const createCategory = (db, fields) => wrapConstraint(() => {
  const sortOrder = fields.sortOrder === undefined ? nextSortOrder(db) : fields.sortOrder
  db.prepare(`
    INSERT INTO categories (slug, name, description, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(fields.slug, fields.name, fields.description, sortOrder)
  return getCategory(db, fields.slug)
})

const updateCategory = (db, slug, fields) => wrapConstraint(() => {
  if (!getCategory(db, slug)) {
    return null
  }
  const sortOrder = fields.sortOrder === undefined ? nextSortOrder(db) : fields.sortOrder
  db.prepare(`
    UPDATE categories
    SET slug = ?, name = ?, description = ?, sort_order = ?
    WHERE slug = ?
  `).run(fields.slug, fields.name, fields.description, sortOrder, slug)
  return getCategory(db, fields.slug)
})

const deleteCategory = (db, slug) => {
  const category = getCategory(db, slug)
  if (!category) {
    return null
  }
  if (category.postCount > 0) {
    throw httpError(409, 'category still has posts')
  }
  db.prepare('DELETE FROM categories WHERE slug = ?').run(slug)
  return true
}

const getSettings = (db) => db.prepare(`
  SELECT title, tagline, welcome, github_url AS githubUrl, footer_year AS footerYear
  FROM site_settings
  WHERE id = 1
`).get() || null

const updateSettings = (db, fields) => {
  const existing = getSettings(db)
  if (!existing) {
    throw httpError(500, 'site_settings is empty')
  }
  db.prepare(`
    UPDATE site_settings
    SET title = ?, tagline = ?, welcome = ?, github_url = ?, footer_year = ?
    WHERE id = 1
  `).run(
    fields.title,
    fields.tagline,
    fields.welcome,
    fields.githubUrl,
    fields.footerYear,
  )
  return getSettings(db)
}

module.exports = {
  createCategory,
  createPost,
  deleteCategory,
  deletePost,
  getCategory,
  getPost,
  getSettings,
  listCategories,
  listPosts,
  updateCategory,
  updatePost,
  updateSettings,
}
