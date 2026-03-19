import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/admin/',
  build: {
    outDir: './build',
    target: 'ESNEXT',
    sourcemap: true,
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  optimizeDeps: { include: ['react/jsx-runtime'] },
  plugins: [react({})],
})
