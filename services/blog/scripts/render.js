const path = require('node:path')
const { openDb } = require('../lib/db')
const { writeSite } = require('../lib/render')

const repoRoot = path.resolve(__dirname, '../../..')

const main = () => {
  const db = openDb()
  try {
    const report = writeSite(repoRoot, db)
    console.log(`wrote ${report.written.length} files`)
    report.written.forEach((file) => {
      console.log(`  ${file}`)
    })
    if (report.deleted.length > 0) {
      console.log(`deleted ${report.deleted.length} stale file${report.deleted.length === 1 ? '' : 's'}`)
      report.deleted.forEach((file) => {
        console.log(`  ${file}`)
      })
    }
  } finally {
    db.close()
  }
}

main()
