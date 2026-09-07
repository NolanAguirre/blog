import { useEffect, useState } from 'react'

export const BASENAME = '/admin'

const listeners = new Set()

let unsavedBlocker = null

export const setUnsavedBlocker = (fn) => {
  unsavedBlocker = fn
}

const confirmLeave = () => {
  if (!unsavedBlocker) {
    return true
  }
  return unsavedBlocker()
}

export const pathFromLocation = () => {
  const pathname = window.location.pathname
  if (pathname === BASENAME || pathname === `${BASENAME}/`) {
    return '/'
  }
  if (pathname.startsWith(`${BASENAME}/`)) {
    return pathname.slice(BASENAME.length)
  }
  return pathname
}

const toUrl = (path) => {
  if (path === '/' || path === '') {
    return `${BASENAME}/`
  }
  return `${BASENAME}${path.startsWith('/') ? path : `/${path}`}`
}

export const hrefFor = (path) => toUrl(path)

export const navigate = (path, { replace = false, force = false } = {}) => {
  if (!force && !confirmLeave()) {
    return false
  }
  const url = toUrl(path)
  if (replace) {
    window.history.replaceState({}, '', url)
  } else {
    window.history.pushState({}, '', url)
  }
  listeners.forEach((fn) => fn())
  return true
}

export const useRoute = () => {
  const [path, setPath] = useState(pathFromLocation)

  useEffect(() => {
    const onChange = () => setPath(pathFromLocation())
    listeners.add(onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('popstate', onChange)
    }
  }, [])

  return { path, navigate }
}

export const matchRoute = (path) => {
  if (path === '/' || path === '') {
    return { name: 'list' }
  }
  if (path === '/posts/new') {
    return { name: 'create' }
  }
  if (path === '/categories') {
    return { name: 'categories' }
  }
  if (path === '/settings') {
    return { name: 'settings' }
  }
  if (path === '/login') {
    return { name: 'login' }
  }
  const postMatch = path.match(/^\/posts\/([^/]+)$/)
  if (postMatch) {
    return { name: 'edit', slug: decodeURIComponent(postMatch[1]) }
  }
  return { name: 'notfound' }
}
