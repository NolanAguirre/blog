const http = require('http')

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 9419)

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, service: 'auth' }))
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
