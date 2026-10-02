const { httpError } = require('./http')

const POST_SELECT = `
  SELECT
    p.id,
    p.slug,
    p.title,
    p.excerpt,
    p.body_html AS bodyHtml,
    p.published_on AS publishedOn,
    p.published,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt
  FROM posts p
`

const CATEGORY_SELECT = `
  SELECT
    c.slug,
    c.name,
    c.description,
    c.sort_order AS sortOrder,
    COUNT(pc.post_id) AS postCount
  FROM categories c
  LEFT JOIN post_categories pc ON pc.category_id = c.id
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

const getCategoryIds = (db, slugs) => slugs.map((slug) => {
  const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)
  if (!row) {
    throw httpError(400, 'categorySlug does not exist')
  }
  return row.id
})

const replacePostCategories = (db, postId, categoryIds) => {
  db.prepare('DELETE FROM post_categories WHERE post_id = ?').run(postId)
  const insert = db.prepare(
    'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
  )
  categoryIds.forEach((categoryId) => {
    insert.run(postId, categoryId)
  })
}

const categoriesByPostId = (db, postIds) => {
  const map = new Map()
  if (postIds.length === 0) {
    return map
  }
  const placeholders = postIds.map(() => '?').join(', ')
  const rows = db.prepare(`
    SELECT
      pc.post_id AS postId,
      c.slug,
      c.name
    FROM post_categories pc
    JOIN categories c ON c.id = pc.category_id
    WHERE pc.post_id IN (${placeholders})
    ORDER BY c.sort_order, c.slug
  `).all(...postIds)
  rows.forEach((row) => {
    const list = map.get(row.postId) || []
    list.push({ slug: row.slug, name: row.name })
    map.set(row.postId, list)
  })
  return map
}

const withCategories = (db, posts) => {
  const map = categoriesByPostId(db, posts.map((post) => post.id))
  return posts.map((post) => {
    const { id, ...rest } = post
    return {
      ...rest,
      categories: map.get(id) || [],
    }
  })
}

const listPosts = (db) => withCategories(db, db.prepare(`
  ${POST_SELECT}
  ORDER BY p.updated_at DESC, p.slug
`).all())

const getPost = (db, slug) => {
  const row = db.prepare(`
    ${POST_SELECT}
    WHERE p.slug = ?
  `).get(slug)
  if (!row) {
    return null
  }
  return withCategories(db, [row])[0]
}

const createPost = (db, fields) => wrapConstraint(() => db.transaction(() => {
  const categoryIds = getCategoryIds(db, fields.categorySlugs)
  const result = db.prepare(`
    INSERT INTO posts (
      slug, title, excerpt, body_html, published_on, published
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    fields.slug,
    fields.title,
    fields.excerpt,
    fields.bodyHtml,
    fields.publishedOn,
    fields.published,
  )
  replacePostCategories(db, Number(result.lastInsertRowid), categoryIds)
  return getPost(db, fields.slug)
})())

const updatePost = (db, slug, fields) => wrapConstraint(() => db.transaction(() => {
  const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug)
  if (!existing) {
    return null
  }
  const categoryIds = getCategoryIds(db, fields.categorySlugs)
  db.prepare(`
    UPDATE posts
    SET
      slug = ?,
      title = ?,
      excerpt = ?,
      body_html = ?,
      published_on = ?,
      published = ?,
      updated_at = datetime('now')
    WHERE slug = ?
  `).run(
    fields.slug,
    fields.title,
    fields.excerpt,
    fields.bodyHtml,
    fields.publishedOn,
    fields.published,
    slug,
  )
  replacePostCategories(db, existing.id, categoryIds)
  return getPost(db, fields.slug)
})())

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
