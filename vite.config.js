import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dockerHost = process.env.DOCKER_BACKEND_HOST || 'localhost';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false,
    proxy: {
      '/api': {
        target: `http://${dockerHost}:3001`,
        changeOrigin: true
      },
      '/health': {
        target: `http://${dockerHost}:3001`,
        changeOrigin: true
      }
    }
  }
})