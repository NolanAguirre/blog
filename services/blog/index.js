const http = require('http')
const { dbFileExists } = require('./lib/db')

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 9418)

if (process.env.DB_PATH && !dbFileExists()) {
  console.warn(`DB_PATH ${process.env.DB_PATH} does not exist; run make db.deploy`)
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, service: 'blog' }))
})

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

server.listen(port, host, () => {
  console.log(`blog listening on http://${host}:${port}`)
})
