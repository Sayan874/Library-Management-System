import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Kill the HMR overlay so it doesn't cover the page on CSS warnings
    hmr: true,
    proxy: {
      '/api': {
        // Explicit IPv4 to avoid Chromium resolving 'localhost' → ::1 (IPv6)
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
