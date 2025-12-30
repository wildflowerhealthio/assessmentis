import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Storybook-specific Vite config without React Router plugin
export default defineConfig({
  plugins: [tsconfigPaths()],
  envPrefix: 'PUBLIC_',
})
