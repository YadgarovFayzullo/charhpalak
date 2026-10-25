import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the build works from any path (Telegram opens it by its URL)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    // Allow tunnel hosts (cloudflared/ngrok) so Telegram can open the dev server over HTTPS.
    allowedHosts: true,
    // Same-origin API in development: one tunnel serves both the app and /api.
    proxy: { '/api': 'http://localhost:8010' },
  },
})
