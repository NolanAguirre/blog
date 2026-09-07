export const StatusBanner = ({ status }) => {
  if (!status || !status.text) {
    return null
  }

  return (
    <div className={`status-banner status-banner-${status.type || 'ok'}`} role="status">
      <p>{status.text}</p>
      {status.href && (
        <a href={status.href} target="_blank" rel="noreferrer">
          {status.hrefLabel || status.href}
        </a>
      )}
    </div>
  )
}
