const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const interpolate = (template, vars) => String(template || '').replace(
  /\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g,
  (match, rawName, escapedName) => {
    const name = rawName || escapedName
    if (!(name in vars)) {
      throw new Error(`Missing template var: ${name}`)
    }
    const value = vars[name] == null ? '' : String(vars[name])
    return rawName ? value : escapeHtml(value)
  },
)

module.exports = {
  escapeHtml,
  interpolate,
}
