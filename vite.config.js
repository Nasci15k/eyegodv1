import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Stub Node-only packages so the browser build doesn't break.
      // pg, pg-copy-streams and friends are only used in upload scripts (*.cjs / upload_ceap.js),
      // never imported by the React app itself.
      external: [],
    },
  },

  // Tell Vite to treat these Node built-ins as empty modules when bundling
  // for the browser (they may be dragged in transitively by pg or similar).
  resolve: {
    alias: {
      // Node core modules — stub them so Vite doesn't crash
      stream: resolve('./src/stubs/empty.js'),
      net:    resolve('./src/stubs/empty.js'),
      tls:    resolve('./src/stubs/empty.js'),
      dns:    resolve('./src/stubs/empty.js'),
      fs:     resolve('./src/stubs/empty.js'),
      os:     resolve('./src/stubs/empty.js'),
      path:   resolve('./src/stubs/empty.js'),
      pg:     resolve('./src/stubs/empty.js'),
      'pg-copy-streams': resolve('./src/stubs/empty.js'),
    },
  },

  // Expose env vars that start with VITE_ to the client bundle
  envPrefix: 'VITE_',
})

