const http = require('node:http')
const path = require('node:path')
const { dbFileExists, openDb } = require('./lib/db')
const { createRouter, httpError, readJson, sendHtml, sendJson } = require('./lib/http')
const {
  loadSite,
  renderPost,
  writeSite,
} = require('./lib/render')
const store = require('./lib/store')
const {
  validateCategory,
  validatePost,
  validatePreview,
  validateSettings,
} = require('./lib/validate')

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 6300)
const repoRoot = path.resolve(__dirname, '../..')

if (process.env.DB_PATH && !dbFileExists()) {
  console.warn(`DB_PATH ${process.env.DB_PATH} does not exist; run make db.blog.deploy`)
}

const withDb = (handler) => async (req, res, params) => {
  const db = openDb()
  try {
    return await handler(req, res, params, db)
  } finally {
    db.close()
  }
}

const requirePost = (db, slug) => {
  const post = store.getPost(db, slug)
  if (!post) {
    throw httpError(404, 'post not found')
  }
  return post
}

const requireCategory = (db, slug) => {
  const category = store.getCategory(db, slug)
  if (!category) {
    throw httpError(404, 'category not found')
  }
  return category
}

const requireSettings = (db) => {
  const settings = store.getSettings(db)
  if (!settings) {
    throw httpError(500, 'site_settings is empty')
  }
  return settings
}

const routes = [
  {
    method: 'GET',
    path: '/api/health',
    handler: (_req, res) => {
      sendJson(res, 200, { ok: true, service: 'blog' })
    },
  },
  {
    method: 'GET',
    path: '/api/posts',
    handler: withDb((_req, res, _params, db) => {
      sendJson(res, 200, { ok: true, posts: store.listPosts(db) })
    }),
  },
  {
    method: 'GET',
    path: '/api/posts/:slug',
    handler: withDb((_req, res, params, db) => {
      sendJson(res, 200, { ok: true, post: requirePost(db, params.slug) })
    }),
  },
  {
    method: 'POST',
    path: '/api/posts',
    handler: withDb(async (req, res, _params, db) => {
      const fields = validatePost(await readJson(req))
      const post = store.createPost(db, fields)
      sendJson(res, 201, { ok: true, post })
    }),
  },
  {
    method: 'PUT',
    path: '/api/posts/:slug',
    handler: withDb(async (req, res, params, db) => {
      const existing = requirePost(db, params.slug)
      const fields = validatePost(await readJson(req), existing)
      const post = store.updatePost(db, params.slug, fields)
      sendJson(res, 200, { ok: true, post })
    }),
  },
  {
    method: 'DELETE',
    path: '/api/posts/:slug',
    handler: withDb((_req, res, params, db) => {
      if (!store.deletePost(db, params.slug)) {
        throw httpError(404, 'post not found')
      }
      sendJson(res, 200, { ok: true })
    }),
  },
  {
    method: 'GET',
    path: '/api/categories',
    handler: withDb((_req, res, _params, db) => {
      sendJson(res, 200, { ok: true, categories: store.listCategories(db) })
    }),
  },
  {
    method: 'GET',
    path: '/api/categories/:slug',
    handler: withDb((_req, res, params, db) => {
      sendJson(res, 200, { ok: true, category: requireCategory(db, params.slug) })
    }),
  },
  {
    method: 'POST',
    path: '/api/categories',
    handler: withDb(async (req, res, _params, db) => {
      const fields = validateCategory(await readJson(req))
      const category = store.createCategory(db, fields)
      sendJson(res, 201, { ok: true, category })
    }),
  },
  {
    method: 'PUT',
    path: '/api/categories/:slug',
    handler: withDb(async (req, res, params, db) => {
      const existing = requireCategory(db, params.slug)
      const fields = validateCategory(await readJson(req), existing)
      const category = store.updateCategory(db, params.slug, fields)
      sendJson(res, 200, { ok: true, category })
    }),
  },
  {
    method: 'DELETE',
    path: '/api/categories/:slug',
    handler: withDb((_req, res, params, db) => {
      const deleted = store.deleteCategory(db, params.slug)
      if (deleted === null) {
        throw httpError(404, 'category not found')
      }
      sendJson(res, 200, { ok: true })
    }),
  },
  {
    method: 'GET',
    path: '/api/settings',
    handler: withDb((_req, res, _params, db) => {
      sendJson(res, 200, { ok: true, settings: requireSettings(db) })
    }),
  },
  {
    method: 'PUT',
    path: '/api/settings',
    handler: withDb(async (req, res, _params, db) => {
      const existing = requireSettings(db)
      const fields = validateSettings(await readJson(req), existing)
      const settings = store.updateSettings(db, fields)
      sendJson(res, 200, { ok: true, settings })
    }),
  },
  {
    method: 'POST',
    path: '/api/render',
    handler: withDb((_req, res, _params, db) => {
      const report = writeSite(repoRoot, db)
      sendJson(res, 200, { ok: true, written: report.written, deleted: report.deleted })
    }),
  },
  {
    method: 'GET',
    path: '/api/preview/posts/:slug',
    handler: withDb((_req, res, params, db) => {
      const post = requirePost(db, params.slug)
      const site = loadSite(db)
      sendHtml(res, 200, renderPost(site, post))
    }),
  },
  {
    method: 'POST',
    path: '/api/preview',
    handler: withDb(async (req, res, _params, db) => {
      const fields = validatePreview(await readJson(req))
      const categories = fields.categorySlugs.map((slug) => {
        const category = store.getCategory(db, slug)
        if (!category) {
          throw httpError(400, 'categorySlug does not exist')
        }
        return { slug: category.slug, name: category.name, sortOrder: category.sortOrder }
      })
      categories.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug))
      const site = loadSite(db)
      sendHtml(res, 200, renderPost(site, {
        ...fields,
        categories: categories.map((category) => ({
          slug: category.slug,
          name: category.name,
        })),
      }))
    }),
  },
]

const server = http.createServer(createRouter(routes))

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(port, host, () => {
  console.log(`blog listening on http://${host}:${port}`)
})
