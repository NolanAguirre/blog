const withPreviewBase = (html) => html.replace('<head>', '<head><base href="/" />')

export const PreviewFrame = ({ html }) => {
  const srcDoc = html ? withPreviewBase(html) : ''

  return (
    <div className="preview-frame-container">
      <iframe
        className="preview-frame"
        title="Post preview"
        sandbox=""
        srcDoc={srcDoc}
      />
    </div>
  )
}
