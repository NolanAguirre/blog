import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 9420)

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    host,
    port,
    strictPort: true,
    hmr: {
      host: '127.0.0.1',
      clientPort: 9417,
    },
  },
})
