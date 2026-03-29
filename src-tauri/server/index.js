const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')
const os = require('os')

// ✅ ALWAYS USE USER WRITABLE DB PATH
const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'SchoolDesk')
const dbPath = path.join(userDataDir, 'school.db')

// Ensure folder exists
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true })
}

// If DB doesn't exist, copy from bundled resources
const bundledDb = path.join(__dirname, '..', 'school.db')
if (!fs.existsSync(dbPath) && fs.existsSync(bundledDb)) {
  fs.copyFileSync(bundledDb, dbPath)
  console.log('✅ Database copied to user directory')
}

process.env.DATABASE_PATH = dbPath
process.env.NODE_ENV = 'production'

const app = next({ dev: false, dir: path.join(__dirname, '..') })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, '127.0.0.1', () => {
    console.log('🚀 Server running at http://127.0.0.1:3000')
  })
}).catch(err => {
  console.error('❌ Server failed:', err)
  process.exit(1)
})