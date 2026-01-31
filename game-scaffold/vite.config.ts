import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    host: true, // Expose to LAN for local testing
  },
})
