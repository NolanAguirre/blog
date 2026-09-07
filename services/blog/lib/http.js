const httpError = (status, message) => {
  const err = new Error(message)
  err.name = 'HttpError'
  err.status = status
  return err
}

const sendJson = (res, status, body) => {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

const sendHtml = (res, status, html) => {
  const body = String(html ?? '')
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const readJson = (req) => new Promise((resolve, reject) => {
  const chunks = []
  req.on('data', (chunk) => {
    chunks.push(chunk)
  })
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8').trim()
    if (!raw) {
      reject(httpError(400, 'JSON body is required'))
      return
    }
    const contentType = String(req.headers['content-type'] || '')
    if (!contentType.includes('application/json')) {
      reject(httpError(400, 'Content-Type must be application/json'))
      return
    }
    try {
      const value = JSON.parse(raw)
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        reject(httpError(400, 'JSON body must be an object'))
        return
      }
      resolve(value)
    } catch {
      reject(httpError(400, 'Invalid JSON'))
    }
  })
  req.on('error', reject)
})

const matchPattern = (pattern, pathname) => {
  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')
  if (patternParts.length !== pathParts.length) {
    return null
  }
  const params = {}
  const matched = patternParts.every((part, index) => {
    if (part.startsWith(':')) {
      try {
        params[part.slice(1)] = decodeURIComponent(pathParts[index])
      } catch {
        return false
      }
      return true
    }
    return part === pathParts[index]
  })
  return matched ? params : null
}

const sendError = (res, err) => {
  if (err && err.name === 'HttpError' && Number.isInteger(err.status)) {
    sendJson(res, err.status, { ok: false, error: err.message })
    return
  }
  console.error(err)
  sendJson(res, 500, { ok: false, error: err && err.message ? err.message : 'internal error' })
}

const createRouter = (routes) => (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  let params = null
  const route = routes.find((candidate) => {
    if (candidate.method !== req.method) {
      return false
    }
    params = matchPattern(candidate.path, pathname)
    return params !== null
  })
  if (!route) {
    sendJson(res, 404, { ok: false, error: 'not found' })
    return
  }
  Promise.resolve(route.handler(req, res, params)).catch((err) => {
    sendError(res, err)
  })
}

module.exports = {
  createRouter,
  httpError,
  readJson,
  sendHtml,
  sendJson,
}
