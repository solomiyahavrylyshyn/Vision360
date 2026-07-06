import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // NOTE: an earlier manualChunks config split React, recharts and react-dnd
  // into separate vendor chunks. Rollup ended up creating a circular
  // dependency between those chunks, so in production a consuming chunk
  // would evaluate `React.forwardRef` before the React chunk finished
  // initialising — blank page + 'Cannot read properties of undefined
  // (reading forwardRef)' on Vercel. Letting Vite pick its default chunking
  // is reliable; bundle size is acceptable.

  // Forward /api calls to the local Express + Postgres server (npm run server).
  // If the server isn't running, requests fail and the stores fall back to seed.
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
