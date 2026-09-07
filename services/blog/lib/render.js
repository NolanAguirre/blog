const fs = require('node:fs')
const path = require('node:path')
const { escapeHtml, interpolate } = require('./html')
const { formatVisibleDate } = require('./parse-html')
const { renderRss: buildRss } = require('./rss')

const layoutsDir = path.join(__dirname, '../layouts')

const readLayout = (relativePath) => fs.readFileSync(path.join(layoutsDir, relativePath), 'utf8').replace(/\n$/, '')

const templates = {
  head: readLayout('partials/head.html'),
  header: readLayout('partials/header.html'),
  footer: readLayout('partials/footer.html'),
  post: readLayout('post.html'),
  list: readLayout('list.html'),
}

const HOME_DISCLAIMER = `
      <blockquote>
        This blog is written with AI as an editor. The core ideas are my own, and I keep my own phrasing as much as possible. I mainly use AI to organize my thoughts into sections and to fix spelling and grammar.
      </blockquote>

`

const INDEX_ITEM = `        <li class="post-preview">
          <h2><a href="{{postHref}}">{{title}}</a></h2>
          <div class="post-meta">
            <a href="{{categoryHref}}" class="post-category">{{categoryName}}</a>
            <time datetime="{{publishedOn}}">{{visibleDate}}</time>
          </div>
          <p class="post-excerpt">{{excerpt}}</p>
        </li>`

const CATEGORY_ITEM = `        <li class="post-preview">
          <h2><a href="{{postHref}}">{{title}}</a></h2>
          <div class="post-meta">
            <time datetime="{{publishedOn}}">{{visibleDate}}</time>
          </div>
          <p class="post-excerpt">{{excerpt}}</p>
        </li>`

const tableExists = (db, name) => {
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(name)
  return Boolean(row)
}

const loadSite = (db) => {
  const missing = ['site_settings', 'categories', 'posts'].filter((name) => !tableExists(db, name))
  if (missing.length > 0) {
    throw new Error(`missing tables: ${missing.join(', ')}. Run \`make db.deploy && make import-html\``)
  }

  const settings = db.prepare(`
    SELECT title, tagline, welcome, github_url AS githubUrl, footer_year AS footerYear
    FROM site_settings
    WHERE id = 1
  `).get()
  if (!settings) {
    throw new Error('site_settings is empty. Run `make db.deploy && make import-html`')
  }

  const categories = db.prepare(`
    SELECT slug, name, description, sort_order AS sortOrder
    FROM categories
    ORDER BY sort_order, slug
  `).all()
  if (categories.length === 0) {
    throw new Error('categories is empty. Run `make db.deploy && make import-html`')
  }

  const posts = db.prepare(`
    SELECT
      p.slug,
      p.title,
      p.excerpt,
      p.body_html AS bodyHtml,
      p.published_on AS publishedOn,
      c.slug AS categorySlug,
      c.name AS categoryName
    FROM posts p
    JOIN categories c ON c.id = p.category_id
    WHERE p.published = 1
    ORDER BY p.published_on DESC, p.slug
  `).all()

  return { settings, categories, posts }
}

const href = (prefix, ...parts) => `${prefix}${parts.join('')}`

const renderNav = (site, prefix, active) => {
  const homeClass = active === 'home' ? ' class="active"' : ''
  const links = [
    `<a href="${escapeHtml(href(prefix, 'index.html'))}"${homeClass}>Home</a>`,
    ...site.categories.map((category) => {
      const cls = active === category.slug ? ' class="active"' : ''
      return `<a href="${escapeHtml(href(prefix, 'categories/', category.slug, '.html'))}"${cls}>${escapeHtml(category.name)}</a>`
    }),
  ]
  return links.map((link) => `        ${link}`).join('\n')
}

const renderChrome = (site, prefix, options) => ({
  head: interpolate(templates.head, {
    title: options.title,
    description: options.description,
    stylesheetHref: href(prefix, 'css/style.css'),
  }),
  header: interpolate(templates.header, {
    homeHref: href(prefix, 'index.html'),
    siteTitle: site.settings.title,
    nav: renderNav(site, prefix, options.active),
  }),
  footer: interpolate(templates.footer, {
    footerYear: String(site.settings.footerYear),
    siteTitle: site.settings.title,
    rssHref: href(prefix, 'rss.xml'),
    githubUrl: site.settings.githubUrl,
  }),
})

const listingVars = (prefix, post) => ({
  postHref: href(prefix, 'posts/', post.slug, '.html'),
  categoryHref: href(prefix, 'categories/', post.categorySlug, '.html'),
  title: post.title,
  categoryName: post.categoryName,
  publishedOn: post.publishedOn,
  visibleDate: formatVisibleDate(post.publishedOn),
  excerpt: post.excerpt,
})

const renderListings = (prefix, posts, itemTemplate) => {
  if (posts.length === 0) {
    return ''
  }
  const items = posts.map((post) => interpolate(itemTemplate, listingVars(prefix, post)))
  return `${items.join('\n\n')}\n`
}

const renderListPage = (site, prefix, options) => {
  const chrome = renderChrome(site, prefix, {
    title: options.title,
    description: options.description,
    active: options.active,
  })
  return interpolate(templates.list, {
    head: chrome.head,
    header: chrome.header,
    footer: chrome.footer,
    heading: options.heading,
    intro: options.intro,
    homeDisclaimer: options.homeDisclaimer ?? '\n',
    listings: renderListings(prefix, options.posts, options.itemTemplate),
  })
}

const renderIndex = (site) => renderListPage(site, '', {
  title: site.settings.title,
  description: site.settings.tagline,
  active: 'home',
  heading: 'Welcome',
  intro: site.settings.welcome,
  homeDisclaimer: HOME_DISCLAIMER,
  posts: site.posts,
  itemTemplate: INDEX_ITEM,
})

const renderCategory = (site, category) => renderListPage(site, '../', {
  title: `${category.name} - ${site.settings.title}`,
  description: category.description,
  active: category.slug,
  heading: category.name,
  intro: category.description,
  posts: site.posts.filter((post) => post.categorySlug === category.slug),
  itemTemplate: CATEGORY_ITEM,
})

const renderPost = (site, post) => {
  const prefix = '../'
  const chrome = renderChrome(site, prefix, {
    title: `${post.title} - ${site.settings.title}`,
    description: post.excerpt,
    active: post.categorySlug,
  })
  return interpolate(templates.post, {
    head: chrome.head,
    header: chrome.header,
    footer: chrome.footer,
    title: post.title,
    categoryHref: href(prefix, 'categories/', post.categorySlug, '.html'),
    categoryName: post.categoryName,
    publishedOn: post.publishedOn,
    visibleDate: formatVisibleDate(post.publishedOn),
    bodyHtml: post.bodyHtml,
  })
}

const renderRss = (site) => {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) {
    throw new Error('SITE_URL is not set')
  }
  return buildRss(site, siteUrl)
}

const relativeFrom = (repoRoot, filePath) => path.relative(repoRoot, filePath)

const writeFile = (filePath, contents) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const body = contents.endsWith('\n') ? contents : `${contents}\n`
  fs.writeFileSync(filePath, body)
}

const syncHtmlDir = (dir, keepNames) => {
  const keep = new Set(keepNames)
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs.readdirSync(dir).flatMap((name) => {
    if (!name.endsWith('.html') || name.startsWith('_') || keep.has(name)) {
      return []
    }
    const filePath = path.join(dir, name)
    fs.unlinkSync(filePath)
    return [filePath]
  })
}

const writeSite = (repoRoot, db) => {
  const site = loadSite(db)
  const written = []
  const write = (relativePath, contents) => {
    const filePath = path.join(repoRoot, relativePath)
    writeFile(filePath, contents)
    written.push(relativePath)
  }

  write('index.html', renderIndex(site))
  site.posts.forEach((post) => {
    write(path.join('posts', `${post.slug}.html`), renderPost(site, post))
  })
  site.categories.forEach((category) => {
    write(path.join('categories', `${category.slug}.html`), renderCategory(site, category))
  })
  write('rss.xml', renderRss(site))

  const deleted = [
    ...syncHtmlDir(
      path.join(repoRoot, 'posts'),
      site.posts.map((post) => `${post.slug}.html`),
    ),
    ...syncHtmlDir(
      path.join(repoRoot, 'categories'),
      site.categories.map((category) => `${category.slug}.html`),
    ),
  ].map((filePath) => relativeFrom(repoRoot, filePath))

  return { written, deleted }
}

module.exports = {
  loadSite,
  renderCategory,
  renderIndex,
  renderPost,
  renderRss,
  writeSite,
}
