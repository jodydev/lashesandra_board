import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => ({
  // Base path: './' per build mobile (Capacitor carica da filesystem); '/' per web
  base: mode === 'mobile' ? './' : '/',
  plugins: [react()],
  server: {
    host: true, // accessibile in rete per live reload da device/simulator
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
}))
