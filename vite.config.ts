import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Kings-s-Path/',
  plugins: [react()],
  server: {
    host: true
  }
})
