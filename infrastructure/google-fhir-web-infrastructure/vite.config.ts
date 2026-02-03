import { defineConfig } from 'vitest/config'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      // To include specific polyfills, add them to the 'include' list
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),
  ],
})
