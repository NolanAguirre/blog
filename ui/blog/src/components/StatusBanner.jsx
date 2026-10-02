import { useEffect, useState } from 'react'

export const StatusBanner = ({ status, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [status])

  if (!status || !status.text || dismissed) {
    return null
  }

  const isError = status.type === 'error'

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  return (
    <div
      className={`status-banner status-banner-${isError ? 'error' : 'ok'}`}
      role="status"
    >
      <div className="status-banner-content">
        <span className="status-banner-icon" aria-hidden="true">
          {isError ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </span>
        <p>
          {status.text}
          {status.href && (
            <a href={status.href} target="_blank" rel="noreferrer">
              {status.hrefLabel || status.href}
            </a>
          )}
        </p>
      </div>
      <button
        type="button"
        className="status-banner-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
