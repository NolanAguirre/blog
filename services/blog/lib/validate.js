const { isIsoDate } = require('./parse-html')
const { httpError } = require('./http')

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const todayUtc = () => new Date().toISOString().slice(0, 10)

const requireString = (value, name, { allowEmpty = false } = {}) => {
  if (typeof value !== 'string') {
    throw httpError(400, `${name} must be a string`)
  }
  if (!allowEmpty && value.trim() === '') {
    throw httpError(400, `${name} is required`)
  }
  return value
}

const requireSlug = (value, name = 'slug') => {
  const slug = requireString(value, name)
  if (!SLUG_RE.test(slug)) {
    throw httpError(400, `${name} must be lowercase-with-hyphens`)
  }
  return slug
}

const requireInt = (value, name) => {
  if (!Number.isInteger(value)) {
    throw httpError(400, `${name} must be an integer`)
  }
  return value
}

const coercePublished = (value, fallback) => {
  if (value === undefined) {
    return fallback
  }
  if (value === true || value === 1) {
    return 1
  }
  if (value === false || value === 0) {
    return 0
  }
  throw httpError(400, 'published must be 0 or 1')
}

const requireIsoDate = (value, name, fallback) => {
  const date = value !== undefined ? value : fallback
  if (!isIsoDate(date)) {
    throw httpError(400, `${name} must be YYYY-MM-DD`)
  }
  return date
}

const validatePost = (fields, existing = {}) => ({
  slug: requireSlug(fields.slug ?? existing.slug),
  title: requireString(fields.title ?? existing.title, 'title'),
  categorySlug: requireSlug(fields.categorySlug ?? existing.categorySlug, 'categorySlug'),
  excerpt: fields.excerpt !== undefined
    ? requireString(fields.excerpt, 'excerpt', { allowEmpty: true })
    : (existing.excerpt ?? ''),
  bodyHtml: fields.bodyHtml !== undefined
    ? requireString(fields.bodyHtml, 'bodyHtml', { allowEmpty: true })
    : (existing.bodyHtml ?? ''),
  publishedOn: requireIsoDate(
    fields.publishedOn,
    'publishedOn',
    existing.publishedOn ?? todayUtc(),
  ),
  published: coercePublished(fields.published, existing.published ?? 0),
})

const validateCategory = (fields, existing = {}) => ({
  slug: requireSlug(fields.slug ?? existing.slug),
  name: requireString(fields.name ?? existing.name, 'name'),
  description: fields.description !== undefined
    ? requireString(fields.description, 'description', { allowEmpty: true })
    : (existing.description ?? ''),
  sortOrder: fields.sortOrder !== undefined
    ? requireInt(fields.sortOrder, 'sortOrder')
    : existing.sortOrder,
})

const validateSettings = (fields, existing) => ({
  title: requireString(fields.title ?? existing.title, 'title'),
  tagline: requireString(fields.tagline ?? existing.tagline, 'tagline', { allowEmpty: true }),
  welcome: requireString(fields.welcome ?? existing.welcome, 'welcome', { allowEmpty: true }),
  githubUrl: requireString(fields.githubUrl ?? existing.githubUrl, 'githubUrl', { allowEmpty: true }),
  footerYear: fields.footerYear !== undefined
    ? requireInt(fields.footerYear, 'footerYear')
    : existing.footerYear,
})

const validatePreview = (fields) => ({
  slug: fields.slug !== undefined ? requireSlug(fields.slug) : 'preview',
  title: fields.title !== undefined
    ? requireString(fields.title, 'title', { allowEmpty: true })
    : '',
  categorySlug: requireSlug(fields.categorySlug, 'categorySlug'),
  excerpt: fields.excerpt !== undefined
    ? requireString(fields.excerpt, 'excerpt', { allowEmpty: true })
    : '',
  bodyHtml: fields.bodyHtml !== undefined
    ? requireString(fields.bodyHtml, 'bodyHtml', { allowEmpty: true })
    : '',
  publishedOn: requireIsoDate(fields.publishedOn, 'publishedOn', todayUtc()),
})

module.exports = {
  todayUtc,
  validateCategory,
  validatePost,
  validatePreview,
  validateSettings,
}
