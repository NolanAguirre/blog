import { useCallback, useEffect, useState } from 'react'
import { formatRenderReport, getSession, renderSite } from './api.js'
import { StatusBanner } from './components/StatusBanner.jsx'
import { hrefFor, matchRoute, useRoute } from './router.js'
import { Categories } from './screens/Categories.jsx'
import { Login } from './screens/Login.jsx'
import { PostEditor } from './screens/PostEditor.jsx'
import { PostList } from './screens/PostList.jsx'
import { Settings } from './screens/Settings.jsx'

const NavLink = ({ to, current, children, onNavigate }) => {
  const active = current === to
  return (
    <a
      href={hrefFor(to)}
      className={active ? 'active' : ''}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return
        }
        event.preventDefault()
        onNavigate(to)
      }}
    >
      {children}
    </a>
  )
}

const App = () => {
  const { path, navigate } = useRoute()
  const route = matchRoute(path)
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(null)
  const [rendering, setRendering] = useState(false)

  const setStatusStable = useCallback((next) => {
    setStatus(next)
  }, [])

  useEffect(() => {
    getSession()
      .then((data) => {
        setSession(data.authenticated === true)
      })
      .catch((err) => {
        setSession(false)
        setStatus({ type: 'error', text: err.message })
      })
  }, [])

  const generateSite = async () => {
    setRendering(true)
    try {
      const report = await renderSite()
      setStatus({ type: 'ok', text: formatRenderReport(report) })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setRendering(false)
    }
  }

  if (session === null) {
    return <div className="app-loading">Loading…</div>
  }

  if (!session) {
    return (
      <Login
        status={status}
        setStatus={setStatusStable}
        onSuccess={() => {
          setSession(true)
          navigate('/', { force: true })
        }}
      />
    )
  }

  const navPath = route.name === 'create' || route.name === 'edit' || route.name === 'list'
    ? '/'
    : path

  return (
    <div className="app">
      <header className="shell">
        <nav className="shell-nav" aria-label="Writer">
          <span className="shell-brand">Writer</span>
          <NavLink to="/" current={navPath} onNavigate={navigate}>Posts</NavLink>
          <NavLink to="/categories" current={navPath} onNavigate={navigate}>Categories</NavLink>
          <NavLink to="/settings" current={navPath} onNavigate={navigate}>Settings</NavLink>
        </nav>
        <div className="shell-actions">
          <button type="button" disabled={rendering} onClick={generateSite}>
            {rendering ? 'Generating…' : 'Generate site'}
          </button>
          <a href="/">View site</a>
        </div>
      </header>
      <StatusBanner status={status} />
      {route.name === 'list' && (
        <PostList navigate={navigate} setStatus={setStatusStable} />
      )}
      {(route.name === 'create' || route.name === 'edit') && (
        <PostEditor
          key={route.name === 'create' ? 'new' : route.slug}
          slug={route.slug}
          isNew={route.name === 'create'}
          navigate={navigate}
          setStatus={setStatusStable}
        />
      )}
      {route.name === 'categories' && (
        <Categories setStatus={setStatusStable} />
      )}
      {route.name === 'settings' && (
        <Settings setStatus={setStatusStable} />
      )}
      {(route.name === 'login' || route.name === 'notfound') && (
        <PostList navigate={navigate} setStatus={setStatusStable} />
      )}
    </div>
  )
}

export default App
