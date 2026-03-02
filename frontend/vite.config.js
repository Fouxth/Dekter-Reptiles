import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.dexterball.com/api',
        // target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://api.dexterball.com/api',
        // target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
