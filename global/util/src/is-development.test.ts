import { afterEach, describe, expect, it, vi } from 'vitest'

// We need a fresh module for each test since isDevelopment reads
// globals at call time, and we want to control the environment.
const loadFresh = async () => {
  const mod = await import('./is-development')
  return mod.isDevelopment
}

describe('isDevelopment', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Node.js environment (process.env)', () => {
    it('returns true when NODE_ENV is "development"', async () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'development' } })
      const isDevelopment = await loadFresh()
      expect(isDevelopment()).toBe(true)
    })

    it('returns false when NODE_ENV is "production"', async () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })
      const isDevelopment = await loadFresh()
      expect(isDevelopment()).toBe(false)
    })

    it('returns false when NODE_ENV is "test"', async () => {
      vi.stubGlobal('process', { env: { NODE_ENV: 'test' } })
      const isDevelopment = await loadFresh()
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('when process is not defined', () => {
    it('returns false when no environment is available', async () => {
      vi.stubGlobal('process', undefined)
      const isDevelopment = await loadFresh()
      // Import.meta.env.MODE in test runner is typically "test", not "development"
      expect(isDevelopment()).toBe(false)
    })
  })
})
