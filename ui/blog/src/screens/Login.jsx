import { useState } from 'react'
import { login } from '../api.js'
import { StatusBanner } from '../components/StatusBanner.jsx'

export const Login = ({ onSuccess, status, setStatus }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await login(username, password)
      onSuccess()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <h1>Writer</h1>
      <p className="muted">Local authoring login</p>
      <StatusBanner status={status} />
      <form className="panel form" onSubmit={onSubmit}>
        <label>
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
