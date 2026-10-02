const path = require('node:path')

const TEMPLATE_TOKENS = ['POST_EXCERPT', 'CATEGORY_SLUG', 'YYYY-MM-DD', 'POST_TITLE']

const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const stripTags = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const decodeEntities = (text) => String(text || '')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&copy;/g, '©')

const firstMatch = (html, regex) => {
  const match = String(html || '').match(regex)
  return match ? match[1] : ''
}

const attr = (tag, name) => {
  const match = String(tag || '').match(new RegExp(`\\b${name}="([^"]*)"`))
  return match ? match[1] : ''
}

const parseVisibleDate = (text) => {
  const trimmed = decodeEntities(String(text || '')).trim()
  const match = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/)
  if (!match) {
    return null
  }
  const month = MONTHS[match[1].toLowerCase()]
  const dayNum = Number(match[2])
  if (!month || dayNum < 1 || dayNum > 31) {
    return null
  }
  return `${match[3]}-${month}-${String(dayNum).padStart(2, '0')}`
}

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))

const formatVisibleDate = (iso) => {
  if (!isIsoDate(iso)) {
    throw new Error(`Invalid ISO date: ${iso}`)
  }
  const [year, month, day] = String(iso).split('-')
  const monthName = MONTH_NAMES[Number(month) - 1]
  if (!monthName) {
    throw new Error(`Invalid ISO date: ${iso}`)
  }
  return `${monthName} ${Number(day)}, ${year}`
}

const slugFromHref = (href) => {
  if (!href || href.includes('CATEGORY_SLUG')) {
    return null
  }
  const base = path.basename(href)
  if (!base.endsWith('.html')) {
    return null
  }
  return base.slice(0, -'.html'.length)
}

const hasTemplateToken = (values) => values.some((value) => (
  TEMPLATE_TOKENS.some((token) => String(value || '').includes(token))
))

const extractPostHeader = (html) => {
  const match = String(html || '').match(/<header class="post-header">([\s\S]*?)<\/header>/)
  return match ? match[1] : ''
}

const extractBodyHtml = (html) => {
  const startMatch = String(html || '').match(/<div class="post-content">/)
  const articleEnd = String(html || '').indexOf('</article>')
  if (!startMatch || articleEnd === -1) {
    return ''
  }
  const start = startMatch.index + startMatch[0].length
  const beforeArticle = html.slice(start, articleEnd)
  const lastDiv = beforeArticle.lastIndexOf('</div>')
  if (lastDiv === -1) {
    return beforeArticle.trim()
  }
  return beforeArticle.slice(0, lastDiv).trim()
}

const extractMetaDescription = (html) => firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/)

const parsePost = (html, options) => {
  const slug = options.slug
  const categoryByName = options.categoryByName || {}
  const header = extractPostHeader(html)
  const title = decodeEntities(stripTags(firstMatch(header, /<h1>([\s\S]*?)<\/h1>/)))
  const categoryTags = header.match(/<a\b[^>]*class="post-category"[^>]*>[\s\S]*?<\/a>/g) || []
  const categories = []
  const seenSlugs = new Set()
  categoryTags.forEach((tag) => {
    const categoryHref = attr(tag, 'href')
    const categoryName = decodeEntities(stripTags(tag))
    const categorySlug = slugFromHref(categoryHref)
      || categoryByName[categoryName.toLowerCase()]
      || null
    if (!categorySlug || seenSlugs.has(categorySlug)) {
      return
    }
    seenSlugs.add(categorySlug)
    categories.push({ slug: categorySlug, name: categoryName })
  })
  const timeTag = header.match(/<time\b[^>]*>[\s\S]*?<\/time>/)
  const datetime = timeTag ? attr(timeTag[0], 'datetime') : ''
  const visibleDate = timeTag ? stripTags(timeTag[0]) : ''
  const publishedOn = parseVisibleDate(visibleDate) || (isIsoDate(datetime) ? datetime : null)
  const metaExcerpt = extractMetaDescription(html)
  const bodyHtml = extractBodyHtml(html)
  const excerptFallback = decodeEntities(stripTags(firstMatch(bodyHtml, /<p>([\s\S]*?)<\/p>/)))
  const usedExcerptFallback = !metaExcerpt || metaExcerpt.includes('POST_EXCERPT')
  const excerpt = usedExcerptFallback ? excerptFallback : decodeEntities(metaExcerpt)
  const published = hasTemplateToken([
    title,
    metaExcerpt,
    ...categoryTags.map((tag) => attr(tag, 'href')),
    datetime,
    visibleDate,
  ]) ? 0 : 1

  return {
    slug,
    title,
    categories,
    publishedOn,
    datetime,
    visibleDate,
    excerpt,
    usedExcerptFallback,
    bodyHtml,
    published,
  }
}

const parseSiteSettings = (html) => {
  const title = decodeEntities(stripTags(firstMatch(html, /<title>([\s\S]*?)<\/title>/)))
    || decodeEntities(stripTags(firstMatch(html, /class="site-title">([\s\S]*?)<\/a>/)))
  const tagline = decodeEntities(extractMetaDescription(html))
  const header = extractPostHeader(html)
  const welcome = decodeEntities(stripTags(firstMatch(header, /<p>([\s\S]*?)<\/p>/)))
  const githubUrl = firstMatch(html, /href="(https:\/\/github\.com\/[^"]+)"/)
  const yearMatch = String(html || '').match(/&copy;\s*(\d{4})/)
    || String(html || '').match(/©\s*(\d{4})/)
  const footerYear = yearMatch ? Number(yearMatch[1]) : null

  return {
    title,
    tagline,
    welcome,
    githubUrl,
    footerYear,
  }
}

const parseCategoriesFromNav = (html) => {
  const nav = firstMatch(html, /<nav class="main-nav">([\s\S]*?)<\/nav>/)
  const categories = []
  const linkRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/g
  let match = linkRe.exec(nav)
  while (match) {
    const href = attr(match[1], 'href')
    if (href.includes('categories/') && href.endsWith('.html')) {
      categories.push({
        slug: slugFromHref(href),
        name: decodeEntities(stripTags(match[2])),
        sortOrder: categories.length + 1,
      })
    }
    match = linkRe.exec(nav)
  }
  return categories
}

const parseCategoryPage = (html) => {
  const header = extractPostHeader(html)
  const fromHeader = decodeEntities(stripTags(firstMatch(header, /<p>([\s\S]*?)<\/p>/)))
  const fromMeta = decodeEntities(extractMetaDescription(html))
  return {
    name: decodeEntities(stripTags(firstMatch(header, /<h1>([\s\S]*?)<\/h1>/))),
    description: fromHeader || fromMeta,
  }
}

module.exports = {
  formatVisibleDate,
  isIsoDate,
  parseCategoriesFromNav,
  parseCategoryPage,
  parsePost,
  parseSiteSettings,
  parseVisibleDate,
}
