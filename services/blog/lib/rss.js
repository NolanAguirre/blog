const escapeXml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const normalizeSiteUrl = (siteUrl) => {
  const value = String(siteUrl || '').replace(/\/+$/, '')
  if (!value) {
    throw new Error('SITE_URL is not set')
  }
  return value
}

const pubDate = (publishedOn) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(publishedOn || ''))) {
    throw new Error(`Invalid ISO date: ${publishedOn}`)
  }
  return new Date(`${publishedOn}T00:00:00Z`).toUTCString()
}

const renderRss = (site, siteUrl) => {
  const base = normalizeSiteUrl(siteUrl)
  const items = site.posts.map((post) => {
    const link = `${base}/posts/${post.slug}.html`
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid>${escapeXml(link)}</guid>`,
      `      <pubDate>${escapeXml(pubDate(post.publishedOn))}</pubDate>`,
      `      <description>${escapeXml(post.excerpt)}</description>`,
      '    </item>',
    ].join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(site.settings.title)}</title>`,
    `    <link>${escapeXml(`${base}/`)}</link>`,
    `    <description>${escapeXml(site.settings.tagline)}</description>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

module.exports = {
  renderRss,
}
