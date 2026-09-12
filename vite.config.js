import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel runs everything in /api as serverless functions in production, but the
// Vite dev server knows nothing about them — so /api/chat would 404 locally.
// This mounts the same handler as dev middleware, giving it the small slice of
// the Node req/res API the handler actually uses.
function apiRoutes() {
  return {
    name: 'dev-api-routes',

    // Vercel injects the project's environment variables into the function's
    // process.env; Vite does not. It reads .env files only to expose VITE_*
    // vars to the browser bundle, so without this the dev handler sees an empty
    // process.env and reports itself unconfigured even with the key sitting in
    // .env.local. Copy the file's values across so local dev matches production.
    //
    // The empty prefix loads every key, not just VITE_* — that is the point,
    // since OPENROUTER_API_KEY must NOT carry that prefix or it would ship to
    // every visitor. Nothing here reaches the browser: this only populates the
    // Node process, and Vite still exposes only VITE_* through import.meta.env.
    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const [key, value] of Object.entries(env)) {
        // A real shell variable wins, matching how a deployed host behaves.
        if (process.env[key] === undefined) process.env[key] = value
      }
    },

    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (!req.url.startsWith('/')) return next()
        try {
          const { default: handler } = await server.ssrLoadModule('/api/chat.js')

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          req.body = chunks.length ? Buffer.concat(chunks).toString('utf8') : ''

          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (payload) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
            return res
          }

          await handler(req, res)
        } catch (err) {
          server.config.logger.error(`[dev-api] ${err.stack || err}`)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'server_error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiRoutes()],
  server: {
    port: 3000,
    strictPort: true,
  },
})
