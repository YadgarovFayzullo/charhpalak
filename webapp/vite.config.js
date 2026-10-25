import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so the build works from any path (Telegram opens it by its URL)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5174, host: true },
})
