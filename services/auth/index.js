const http = require('node:http')

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 6301)

const sendJson = (res, status, body) => {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

const drain = (req) => new Promise((resolve) => {
  req.on('data', () => {})
  req.on('end', resolve)
})

const routes = {
  'GET /auth/health': (_req, res) => {
    sendJson(res, 200, { ok: true, service: 'auth' })
  },
  'GET /auth/session': (_req, res) => {
    sendJson(res, 200, { ok: true, authenticated: true })
  },
  'POST /auth/login': async (req, res) => {
    await drain(req)
    sendJson(res, 200, { ok: true, authenticated: true })
  },
  'POST /auth/logout': async (req, res) => {
    await drain(req)
    sendJson(res, 200, { ok: true, authenticated: false })
  },
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const handler = routes[`${req.method} ${pathname}`]
  if (!handler) {
    sendJson(res, 404, { ok: false, error: 'not found' })
    return
  }
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error(err)
    sendJson(res, 500, { ok: false, error: err && err.message ? err.message : 'internal error' })
  })
})

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(port, host, () => {
  console.log(`auth listening on http://${host}:${port}`)
})
