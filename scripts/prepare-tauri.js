#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const ROOT = path.join(__dirname, '..')
const TAURI_DIR = path.join(ROOT, 'src-tauri')
const SERVER_DIR = path.join(TAURI_DIR, 'server')
const BINARIES_DIR = path.join(TAURI_DIR, 'binaries')

console.log('📦 Building Next.js...')
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })

console.log('📂 Preparing folders...')
fs.mkdirSync(SERVER_DIR, { recursive: true })
fs.mkdirSync(BINARIES_DIR, { recursive: true })

// ✅ SAFE DATABASE PATH (USER WRITABLE)
const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'SchoolDesk')
const dbPath = path.join(userDataDir, 'school.db')

// ── SERVER SCRIPT ─────────────────────────────────────────────
const serverScript = `
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
`

fs.writeFileSync(path.join(SERVER_DIR, 'index.js'), serverScript.trim())
console.log('✅ Server script created')

// ── NODE BINARY ───────────────────────────────────────────────
const nodeSrc = process.execPath
const destBinary = path.join(BINARIES_DIR, 'node-x86_64-pc-windows-msvc.exe')

if (!fs.existsSync(destBinary)) {
  fs.copyFileSync(nodeSrc, destBinary)
  console.log('✅ Node binary copied')
}

// ── COPY DATABASE TO BUNDLE ───────────────────────────────────
const dbSrc = path.join(ROOT, 'school.db')
const dbDest = path.join(TAURI_DIR, 'school.db')

if (fs.existsSync(dbSrc)) {
  fs.copyFileSync(dbSrc, dbDest)
  console.log('✅ DB bundled for first run')
}

console.log('\n🎉 DONE! Now run: npm run tauri build')