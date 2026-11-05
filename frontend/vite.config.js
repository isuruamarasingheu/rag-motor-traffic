import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ask': 'http://127.0.0.1:8005',
      '/health': 'http://127.0.0.1:8005',
      '/sections': 'http://127.0.0.1:8005',
      '/fines': 'http://127.0.0.1:8005',
      '/translate': 'http://127.0.0.1:8005',
    },
  },
})

