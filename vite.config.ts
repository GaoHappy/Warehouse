import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'fs'

function saveConfigPlugin(): Plugin {
  return {
    name: 'save-config',
    configureServer(server) {
      server.middlewares.use('/api/save-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const dir = resolve(__dirname, 'public/asset')
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true })
            }
            const payload = JSON.parse(body)
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
              resolve(dir, filename),
              JSON.stringify(config, null, 2),
              'utf-8',
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, filename }))
          } catch (e: any) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })

      server.middlewares.use('/api/latest-config', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const projectName = url.searchParams.get('projectName') || '默认项目'
          const dir = resolve(__dirname, 'public/asset')

          if (!existsSync(dir)) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ config: null }))
            return
          }

          const files = readdirSync(dir)
          const prefix = `${projectName}_`
          const versionedFiles = files
            .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
            .sort()
            .reverse()

          if (versionedFiles.length === 0) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ config: null }))
            return
          }

          const latestFile = versionedFiles[0]
          const content = readFileSync(resolve(dir, latestFile), 'utf-8')
          const config = JSON.parse(content)

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ config, filename: latestFile }))
        } catch (e: any) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [vue(), saveConfigPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
