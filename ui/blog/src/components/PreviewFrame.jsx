const withPreviewBase = (html) => html.replace('<head>', '<head><base href="/" />')

export const PreviewFrame = ({ html }) => {
  const srcDoc = html ? withPreviewBase(html) : ''

  return (
    <iframe
      className="preview-frame"
      title="Post preview"
      sandbox=""
      srcDoc={srcDoc}
    />
  )
}
