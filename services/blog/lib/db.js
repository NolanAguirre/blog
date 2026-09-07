const fs = require('node:fs')
const path = require('node:path')
const { DatabaseSync } = require('node:sqlite')

const resolveDbPath = () => {
  const dbPath = process.env.DB_PATH
  if (!dbPath) {
    throw new Error('DB_PATH is not set')
  }
  return path.resolve(dbPath)
}

const openDb = () => {
  const dbPath = resolveDbPath()
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA journal_mode = WAL')
  return db
}

const dbFileExists = () => {
  if (!process.env.DB_PATH) {
    return false
  }
  return fs.existsSync(resolveDbPath())
}

module.exports = {
  dbFileExists,
  openDb,
  resolveDbPath,
}
