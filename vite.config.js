import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import enka from './api/enka.js'

// En Vercel, api/enka.js es una función de servidor. En local (vite dev y vite preview) se sirve
// con este middleware para que /api/enka funcione igual.
const apiLocal = {
  name: 'api-local',
  configureServer(server) {
    server.middlewares.use('/api/enka', (req, res) => enka(req, res))
  },
  configurePreviewServer(server) {
    server.middlewares.use('/api/enka', (req, res) => enka(req, res))
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiLocal],
})
