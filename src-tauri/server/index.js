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