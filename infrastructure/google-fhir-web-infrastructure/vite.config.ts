import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    nodePolyfills({
      // To include specific polyfills, add them to the 'include' list
      globals: {
        Buffer: true,
      },
      include: ['buffer'],
    }),
  ],
})
