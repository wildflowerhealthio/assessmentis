/// <reference types="vitest" />
/// <reference types="vite/client" />

import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => ({
  build: {
    ssr: false,
  },
  envPrefix: 'PUBLIC_',
  optimizeDeps: {},
  plugins: [reactRouter(), tsconfigPaths()],
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
