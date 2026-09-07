const fs = require('node:fs')
const path = require('node:path')
const { openDb } = require('../lib/db')
const {
  parseCategoriesFromNav,
  parseCategoryPage,
  parsePost,
  parseSiteSettings,
} = require('../lib/parse-html')

const repoRoot = path.resolve(__dirname, '../../..')

const readFile = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

const tableExists = (db, name) => {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(name)
  return Boolean(row)
}

const loadSource = () => {
  const indexHtml = readFile('index.html')
  const settings = parseSiteSettings(indexHtml)
  const navCategories = parseCategoriesFromNav(indexHtml)
  const categories = navCategories.map((category) => {
    const page = parseCategoryPage(readFile(`categories/${category.slug}.html`))
    return {
      slug: category.slug,
      name: category.name,
      description: page.description,
      sortOrder: category.sortOrder,
    }
  })
  const categoryByName = Object.fromEntries(
    categories.map((category) => [category.name.toLowerCase(), category.slug]),
  )
  const postsDir = path.join(repoRoot, 'posts')
  const posts = fs.readdirSync(postsDir)
    .filter((name) => name.endsWith('.html') && name !== '_template.html')
    .map((name) => {
      const slug = name.slice(0, -'.html'.length)
      return parsePost(readFile(`posts/${name}`), { slug, categoryByName })
    })

  return { settings, categories, posts }
}

const upsert = (db, source) => {
  db.prepare(`
    INSERT INTO site_settings (id, title, tagline, welcome, github_url, footer_year)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      tagline = excluded.tagline,
      welcome = excluded.welcome,
      github_url = excluded.github_url,
      footer_year = excluded.footer_year
  `).run(
    source.settings.title,
    source.settings.tagline,
    source.settings.welcome,
    source.settings.githubUrl,
    source.settings.footerYear,
  )

  const upsertCategory = db.prepare(`
    INSERT INTO categories (slug, name, description, sort_order)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order
  `)
  source.categories.forEach((category) => {
    upsertCategory.run(category.slug, category.name, category.description, category.sortOrder)
  })

  const categoryIds = Object.fromEntries(
    db.prepare('SELECT id, slug FROM categories').all().map((row) => [row.slug, row.id]),
  )

  const upsertPost = db.prepare(`
    INSERT INTO posts (
      slug, title, category_id, excerpt, body_html, published_on, published, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      category_id = excluded.category_id,
      excerpt = excluded.excerpt,
      body_html = excluded.body_html,
      published_on = excluded.published_on,
      published = excluded.published,
      updated_at = excluded.updated_at
  `)

  source.posts.forEach((post) => {
    if (!post.publishedOn) {
      throw new Error(`Could not parse published_on for ${post.slug}`)
    }
    if (!post.categorySlug || categoryIds[post.categorySlug] == null) {
      throw new Error(`Could not resolve category for ${post.slug}`)
    }
    upsertPost.run(
      post.slug,
      post.title,
      categoryIds[post.categorySlug],
      post.excerpt,
      post.bodyHtml,
      post.publishedOn,
      post.published,
    )
  })
}

const printReport = (source) => {
  const published = source.posts.filter((post) => post.published === 1)
  const drafts = source.posts.filter((post) => post.published === 0)
  const draftSlugs = drafts.map((post) => post.slug).join(', ')
  console.log(
    `${source.posts.length} posts, ${published.length} published / ${drafts.length} draft${drafts.length === 1 ? '' : 's'}`
      + (draftSlugs ? ` (${draftSlugs})` : ''),
  )

  const dateOverrides = source.posts.filter((post) => post.datetime && post.datetime !== post.publishedOn)
  if (dateOverrides.length > 0) {
    console.log('date overrides:')
    dateOverrides.forEach((post) => {
      console.log(`  ${post.slug} ${post.datetime} → ${post.publishedOn}`)
    })
  }

  const excerptFallbacks = source.posts.filter((post) => post.usedExcerptFallback)
  if (excerptFallbacks.length > 0) {
    console.log('excerpt fallback:')
    excerptFallbacks.forEach((post) => {
      console.log(`  ${post.slug} used first paragraph`)
    })
  }

  console.log(
    'note: listing excerpts on the homepage/category pages sometimes differ from meta; the db stores meta (or the fallback). Phase 3 listings will use the db field.',
  )
}

const main = () => {
  const db = openDb()
  try {
    if (!tableExists(db, 'posts')) {
      console.error('posts table is missing. Run `make db.deploy` first.')
      process.exit(1)
    }

    const existing = db.prepare('SELECT COUNT(*) AS count FROM posts').get()
    if (existing.count > 0 && process.env.FORCE !== '1') {
      console.error('posts already exist. Re-run with FORCE=1 to upsert.')
      process.exit(1)
    }

    const source = loadSource()
    db.exec('BEGIN')
    try {
      upsert(db, source)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    printReport(source)
  } finally {
    db.close()
  }
}

main()
