import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  build: {
    outDir: './build',
    target: 'ESNEXT',
    sourcemap: true,
  },
  base: '/admin/',
  optimizeDeps: { include: ['react/jsx-runtime'] },
  plugins: [react({})],
})
