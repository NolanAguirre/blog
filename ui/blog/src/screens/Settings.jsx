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
      setStatus({ type: 'ok', text: 'Settings saved. Generate site to write the public pages.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading settings…</p>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1>Site settings</h1>
        <p className="muted">Save here, then Generate site to update the public HTML.</p>
      </div>

      <form className="panel form" onSubmit={onSave}>
        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </label>
        <label>
          Footer year
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
            value={form.tagline}
            onChange={(event) => patch({ tagline: event.target.value })}
          />
        </label>
        <label className="span-2">
          GitHub URL
          <input
            type="url"
            value={form.githubUrl}
            onChange={(event) => patch({ githubUrl: event.target.value })}
          />
        </label>
        <label className="span-2">
          Welcome
          <textarea
            rows="5"
            value={form.welcome}
            onChange={(event) => patch({ welcome: event.target.value })}
          />
        </label>
        <div className="form-actions span-2">
          <button type="submit" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </section>
  )
}
