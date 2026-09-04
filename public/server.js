import express from 'express'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))

const ASSET_DIR = resolve(__dirname, 'asset')

function ensureAssetDir () {
  if (!existsSync(ASSET_DIR)) {
    mkdirSync(ASSET_DIR, { recursive: true })
  }
}

app.post('/api/save-config', (req, res) => {
  try {
    ensureAssetDir()
    const payload = req.body
    const config = payload.config || payload
    const target = payload.target

    let filename = 'warehouse-config.json'
    if (target === 'versioned' && payload.projectName) {
      const now = new Date()
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '_',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('')
      filename = `${payload.projectName}_${timestamp}.json`
    }

    writeFileSync(
      resolve(ASSET_DIR, filename),
      JSON.stringify(config, null, 2),
      'utf-8',
    )
    res.json({ success: true, filename })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/latest-config', (req, res) => {
  try {
    const projectName = req.query.projectName || '默认项目'

    if (!existsSync(ASSET_DIR)) {
      res.json({ config: null })
      return
    }

    const files = readdirSync(ASSET_DIR)
    const prefix = `${projectName}_`
    const versionedFiles = files
      .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
      .sort()
      .reverse()

    if (versionedFiles.length === 0) {
      res.json({ config: null })
      return
    }

    const latestFile = versionedFiles[0]
    const content = readFileSync(resolve(ASSET_DIR, latestFile), 'utf-8')
    const config = JSON.parse(content)

    res.json({ config, filename: latestFile })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.use(express.static(__dirname))

app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})