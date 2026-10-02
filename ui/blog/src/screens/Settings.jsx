import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api.js'

const emptySettings = () => ({
  title: '',
  tagline: '',
  welcome: '',
  githubUrl: '',
  footerYear: new Date().getUTCFullYear(),
})

export const Settings = ({ setStatus }) => {
  const [form, setForm] = useState(emptySettings)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getSettings()
        if (!cancelled) {
          setForm({
            title: data.settings.title ?? '',
            tagline: data.settings.tagline ?? '',
            welcome: data.settings.welcome ?? '',
            githubUrl: data.settings.githubUrl ?? '',
            footerYear: data.settings.footerYear,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({ type: 'error', text: err.message })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [setStatus])

  const patch = (updates) => {
    setForm((current) => ({ ...current, ...updates }))
  }

  const onSave = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const data = await updateSettings({
        title: form.title,
        tagline: form.tagline,
        welcome: form.welcome,
        githubUrl: form.githubUrl,
        footerYear: Number.parseInt(String(form.footerYear), 10),
      })
      setForm({
        title: data.settings.title,
        tagline: data.settings.tagline,
        welcome: data.settings.welcome,
        githubUrl: data.settings.githubUrl,
        footerYear: data.settings.footerYear,
      })
      setStatus({ type: 'ok', text: 'Settings saved. Generate site to write public pages.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="app-loading">
          <div className="spinner" />
          <p>Loading settings…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Site settings</h1>
          <p className="muted">Configure site metadata, home text, and external links.</p>
        </div>
        <button
          type="submit"
          form="site-settings-form"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <form id="site-settings-form" className="settings-grid" onSubmit={onSave}>
        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Site identity</h2>
            <p>Main blog title and tagline appearing in the header and metadata.</p>
          </div>

          <div className="form">
            <label>
              Site title
              <input
                type="text"
                placeholder="e.g. Nolan's Blog"
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </label>

            <label>
              Footer copyright year
              <input
                type="number"
                step="1"
                value={form.footerYear}
                onChange={(event) => patch({ footerYear: event.target.value })}
              />
            </label>

            <label className="span-2">
              Tagline
              <input
                type="text"
                placeholder="A short subtitle for your site"
                value={form.tagline}
                onChange={(event) => patch({ tagline: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Homepage welcome</h2>
            <p>Introductory paragraph shown at the top of the homepage.</p>
          </div>

          <div>
            <label>
              Welcome message
              <textarea
                rows="4"
                placeholder="Thoughts on software engineering, architecture, and technology…"
                value={form.welcome}
                onChange={(event) => patch({ welcome: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Links & social</h2>
            <p>External links displayed in your blog header or footer.</p>
          </div>

          <div className="form">
            <label className="span-2">
              GitHub profile URL
              <input
                type="url"
                placeholder="https://github.com/username"
                value={form.githubUrl}
                onChange={(event) => patch({ githubUrl: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  )
}
