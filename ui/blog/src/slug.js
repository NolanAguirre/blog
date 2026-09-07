export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugFromTitle = (title) => title
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const todayUtc = () => new Date().toISOString().slice(0, 10)
