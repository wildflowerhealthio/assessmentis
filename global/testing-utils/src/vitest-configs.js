import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { loadEnv, mergeConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const base = defineConfig(({ mode }) => ({
  test: {
    globals: true,
    plugins: [tsconfigPaths()],
    setupFiles: ['../../global/testing-utils/src/vitest.setup.ts'],
    // eslint-disable-next-line no-undef
    env: loadEnv(mode, process.cwd(), ''),
  },
}))

const unit = defineConfig((_configEnv) => ({
  test: {
    include: ['**/!({*.e2e,*.integration,*.interface}).test.{ts,tsx}'],
  },
}))

const integration = defineConfig((_configEnv) => ({
  test: {
    include: ['**/*.integration.test.{ts,tsx}'],
    sequence: {
      groupOrder: 10,
    },
    // Run sequentially to avoid rate limiting
    maxWorkers: 1,
    isolate: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
}))

const e2e = defineConfig((_configEnv) =>
  defineConfig({
    test: {
      include: ['**/*.e2e.test.{ts,tsx}'],
      // Run sequentially to avoid rate limiting
      maxWorkers: 1,
      isolate: false,
      testTimeout: 30000,
      hookTimeout: 30000,
    },
  })
)

const browser = defineConfig(() => ({
  plugins: [react(), tsconfigPaths()],

  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      // at least one instance is required
      instances: [{ browser: 'chromium', headless: true }],
    },
  },
}))

const node = defineConfig(() => ({
  plugins: [tsconfigPaths()],

  test: {
    environment: 'node',
  },
}))

const jsdom = defineConfig(() => ({
  plugins: [react(), tsconfigPaths()],

  test: {
    environment: 'jsdom',
  },
}))

/** @type {ViteUserConfigFnObject} */
export const browserUnit = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), browser(configEnv)),
      unit(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const browserIntegration = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), integration(configEnv)),
      browser(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const browserE2e = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), e2e(configEnv)),
      browser(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const nodeUnit = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(mergeConfig(base(configEnv), node(configEnv)), unit(configEnv)),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const nodeIntegration = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), node(configEnv)),
      integration(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const jsdomUnit = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), jsdom(configEnv)),
      unit(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)

/** @type {ViteUserConfigFnObject} */
export const jsdomIntegration = defineConfig((configEnv) =>
  mergeConfig(
    mergeConfig(
      mergeConfig(base(configEnv), jsdom(configEnv)),
      integration(configEnv)
    ),
    defineConfig({
      test: {},
    })
  )
)
