import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from "vite-plugin-dts"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    dts({ tsconfigPath: './tsconfig.app.json' })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: "index",
      formats: ['es']
    }
  }
})
