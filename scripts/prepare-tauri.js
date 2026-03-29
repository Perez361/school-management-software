#!/usr/bin/env node
/**
 * scripts/prepare-tauri.js
 *
 * Pre-build validator for the Tauri static-export architecture.
 *
 * What this does NOT do (old wrong approach):
 *   ✗ Bundle a Node.js server
 *   ✗ Copy a node.exe binary
 *   ✗ Write a server/index.js
 *   ✗ Start an HTTP server
 *
 * What it DOES do (correct approach):
 *   ✓ Verify next.config.ts has output: 'export'
 *   ✓ Verify /out directory exists after build
 *   ✓ Verify /out/index.html exists (the Tauri entry point)
 *   ✓ Migrate existing school.db to the correct Tauri app-data path
 *   ✓ Print a clear summary so you know the build is ready
 *
 * Architecture reminder:
 *   Next.js (static)  →  /out/  →  Tauri WebView (reads local files)
 *   UI invoke()       →  Rust commands  →  rusqlite  →  school.db
 *   No HTTP server. No Node.js at runtime. Fully offline.
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const ROOT    = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'out')

// ── 1. Check output directory ─────────────────────────────────────────────────
console.log('\n🔍 Checking Next.js static export...')

if (!fs.existsSync(OUT_DIR)) {
  console.error('❌  /out directory not found.')
  console.error('    Run "npm run build" first, then "npx tauri build".')
  process.exit(1)
}

const indexHtml = path.join(OUT_DIR, 'index.html')
if (!fs.existsSync(indexHtml)) {
  console.error('❌  /out/index.html missing.')
  console.error('    The Next.js build did not produce a static export.')
  console.error('    Check that next.config.ts has: output: "export"')
  process.exit(1)
}

console.log('✅  /out/index.html found — static export is correct.')

// ── 2. Check next.config.ts has output: 'export' ─────────────────────────────
const nextConfigPath = path.join(ROOT, 'next.config.ts')
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8')
  if (!configContent.includes("output: 'export'") && !configContent.includes('output: "export"')) {
    console.warn('⚠️   next.config.ts does not appear to have output: "export".')
    console.warn('    Add it or the built .exe will show a blank screen.')
  } else {
    console.log('✅  next.config.ts has output: "export".')
  }
}

// ── 3. Migrate existing school.db if present ─────────────────────────────────
console.log('\n🗄️  Checking database...')

// Tauri app-data path on Windows
const appDataDir = path.join(
  os.homedir(),
  'AppData', 'Local', 'com.adahigh.sms'
)
const targetDb = path.join(appDataDir, 'school.db')
const sourceDb = path.join(ROOT, 'school.db')

if (!fs.existsSync(targetDb)) {
  fs.mkdirSync(appDataDir, { recursive: true })

  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, targetDb)
    console.log(`✅  Migrated school.db → ${targetDb}`)
  } else {
    console.log('ℹ️   No school.db found — a fresh database will be created')
    console.log(`    on first launch at: ${targetDb}`)
  }
} else {
  console.log(`✅  Database already exists at: ${targetDb}`)
}

// ── 4. Verify no server remnants ──────────────────────────────────────────────
const serverDir = path.join(ROOT, 'src-tauri', 'server')
if (fs.existsSync(serverDir)) {
  console.warn('\n⚠️   src-tauri/server/ directory found from old build approach.')
  console.warn('    It is safe to delete: rm -rf src-tauri/server/')
}

const binariesDir = path.join(ROOT, 'src-tauri', 'binaries')
if (fs.existsSync(binariesDir)) {
  const files = fs.readdirSync(binariesDir)
  const nodeExe = files.find(f => f.startsWith('node-'))
  if (nodeExe) {
    console.warn('\n⚠️   src-tauri/binaries/node-*.exe found from old build approach.')
    console.warn('    It is safe to delete — Node.js is NOT bundled in this architecture.')
    console.warn(`    Delete: src-tauri/binaries/${nodeExe}`)
  }
}

// ── 5. Summary ────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║  ✅  Build validation passed!                        ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log('║                                                      ║')
console.log('║  Architecture: Static Export + Rust Backend          ║')
console.log('║  Database:     rusqlite (no Prisma, no Node server)  ║')
console.log('║  Offline:      100% — no internet required           ║')
console.log('║                                                      ║')
console.log('║  The .exe installer will be in:                      ║')
console.log('║  src-tauri/target/release/bundle/nsis/               ║')
console.log('╚══════════════════════════════════════════════════════╝')
console.log('')