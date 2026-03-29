#!/usr/bin/env node
// scripts/prepare-tauri.js
// Run this before `tauri build`: node scripts/prepare-tauri.js

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')
const { createWriteStream } = require('fs')

const ROOT = path.join(__dirname, '..')
const TAURI_DIR = path.join(ROOT, 'src-tauri')
const SERVER_DIR = path.join(TAURI_DIR, 'server')
const BINARIES_DIR = path.join(TAURI_DIR, 'binaries')

// ── 1. Build Next.js ─────────────────────────────────────────────────────────
console.log('📦 Building Next.js...')
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })

// ── 2. Create server directory ────────────────────────────────────────────────
console.log('📂 Creating server directory...')
fs.mkdirSync(SERVER_DIR, { recursive: true })
fs.mkdirSync(BINARIES_DIR, { recursive: true })

// ── 3. Write the sidecar server entry ────────────────────────────────────────
const serverScript = `
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')

// When running as Tauri resource, the .next folder and node_modules
// are bundled alongside this file in the resource dir.
const resourceDir = path.dirname(process.execPath) === process.cwd()
  ? path.dirname(process.argv[1])
  : path.join(path.dirname(process.argv[1]), '..')

const dir = resourceDir

process.env.NODE_ENV = 'production'

const app = next({ dev: false, dir })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, '127.0.0.1', (err) => {
    if (err) throw err
    console.log('> SchoolDesk server ready on http://127.0.0.1:3000')
  })
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
`

fs.writeFileSync(path.join(SERVER_DIR, 'index.js'), serverScript.trim())
console.log('✅ Server entry written')

// ── 4. Download Node.js binary ────────────────────────────────────────────────
// We use the same Node version as the host machine for compatibility
const nodeVersion = process.version  // e.g. v20.11.0
const platform = process.platform    // win32, linux, darwin
const arch = process.arch            // x64, arm64

const platformMap = {
  win32: 'win',
  linux: 'linux',
  darwin: 'darwin',
}
const archMap = {
  x64: 'x64',
  arm64: 'arm64',
}

const nodePlatform = platformMap[platform]
const nodeArch = archMap[arch]

if (!nodePlatform || !nodeArch) {
  console.error(`❌ Unsupported platform: ${platform}/${arch}`)
  process.exit(1)
}

const binaryName = platform === 'win32' ? 'node.exe' : 'node'
const tauriTarget = getTauriTarget(platform, arch)
const destBinary = path.join(BINARIES_DIR, `node-${tauriTarget}${platform === 'win32' ? '.exe' : ''}`)

function getTauriTarget(platform, arch) {
  // Tauri expects binaries named: name-{target-triple}
  if (platform === 'win32' && arch === 'x64') return 'x86_64-pc-windows-msvc'
  if (platform === 'win32' && arch === 'arm64') return 'aarch64-pc-windows-msvc'
  if (platform === 'linux' && arch === 'x64') return 'x86_64-unknown-linux-gnu'
  if (platform === 'linux' && arch === 'arm64') return 'aarch64-unknown-linux-gnu'
  if (platform === 'darwin' && arch === 'x64') return 'x86_64-apple-darwin'
  if (platform === 'darwin' && arch === 'arm64') return 'aarch64-apple-darwin'
  return 'x86_64-pc-windows-msvc'
}

if (fs.existsSync(destBinary)) {
  console.log(`✅ Node binary already exists at ${destBinary}`)
} else {
  // Just copy the current node binary (same version, same OS)
  const currentNodeBin = process.execPath
  console.log(`📋 Copying Node binary from ${currentNodeBin}...`)
  fs.copyFileSync(currentNodeBin, destBinary)
  if (platform !== 'win32') {
    fs.chmodSync(destBinary, 0o755)
  }
  console.log(`✅ Node binary copied to ${destBinary}`)
}

// ── 5. Copy school.db to tauri resources (if not already there) ──────────────
const dbSrc = path.join(ROOT, 'school.db')
const dbDest = path.join(TAURI_DIR, 'school.db')
if (fs.existsSync(dbSrc) && !fs.existsSync(dbDest)) {
  fs.copyFileSync(dbSrc, dbDest)
  console.log('✅ Copied school.db to src-tauri/')
}

console.log('\n🎉 Tauri preparation complete!')
console.log('   Now run: npm run tauri build')