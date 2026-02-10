/// <reference types="vitest" />
/// <reference types="vite/client" />

import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => ({
  plugins: [reactRouter(), tsconfigPaths()],
  envPrefix: 'PUBLIC_',
  optimizeDeps: {},
  build: {
    ssr: false,
  },
  server: {
    proxy: {
      '/api/': {
        target: 'https://assessmentis.firebaseapp.com',
        changeOrigin: true,
      },
      '/admin/': {
        target: 'http://localhost:5175/',
        changeOrigin: true,
      },
    },
  },
}))
