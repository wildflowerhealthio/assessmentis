import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import * as fc from 'fast-check'
import { usePromiseOrDefault } from './usePromiseOrDefault'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('usePromiseOrDefault', () => {
  describe('initial state', () => {
    it('should return default value initially', () => {
      const promise = new Promise<string>(() => {}) // never resolves
      const defaultValue = 'default'
      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)
    })

    it('should handle any default value type', () => {
      const promise = new Promise<number>(() => {})
      const defaultValue = 42
      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)
    })
  })

  describe('promise resolution', () => {
    it('should return resolved value after promise resolves', async () => {
      const promise = Promise.resolve('resolved-value')
      const defaultValue = 'default'
      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)

      await waitFor(() => {
        expect(result.current).toBe('resolved-value')
      })
    })

    it('property: resolved value replaces default', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (defaultVal, resolvedVal) => {
            const promise = Promise.resolve(resolvedVal)
            const { result, unmount } = renderHook(() =>
              usePromiseOrDefault(promise, defaultVal)
            )

            await waitFor(() => {
              expect(result.current).toBe(resolvedVal)
            })

            unmount()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should handle complex object types', async () => {
      type User = { name: string; age: number }
      const defaultUser: User = { name: 'Default', age: 0 }
      const resolvedUser: User = { name: 'Alice', age: 30 }
      const promise = Promise.resolve(resolvedUser)

      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultUser)
      )

      expect(result.current).toEqual(defaultUser)

      await waitFor(() => {
        expect(result.current).toEqual(resolvedUser)
      })
    })
  })

  describe('promise rejection', () => {
    it('should return default value on promise rejection', async () => {
      const error = new Error('test error')
      const promise = Promise.reject(error)
      const defaultValue = 'fallback'

      promise.catch(() => {}) // Prevent unhandled rejection

      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)

      // Give time for promise to reject
      await new Promise((r) => setTimeout(r, 50))

      // Should still be default value after rejection
      expect(result.current).toBe(defaultValue)
    })

    it('should not throw on rejection', async () => {
      const promise = Promise.reject(new Error('error'))
      const defaultValue = 'safe'

      promise.catch(() => {})

      expect(() => {
        renderHook(() => usePromiseOrDefault(promise, defaultValue))
      }).not.toThrow()

      await new Promise((r) => setTimeout(r, 50))
    })
  })

  describe('promise reference changes', () => {
    it('should reset to default when promise reference changes', async () => {
      const promise1 = Promise.resolve('first')
      const defaultValue = 'default'
      const { result, rerender } = renderHook(
        ({ p }) => usePromiseOrDefault(p, defaultValue),
        { initialProps: { p: promise1 } }
      )

      // Wait for first promise to resolve
      await waitFor(() => {
        expect(result.current).toBe('first')
      })

      // Change promise reference
      const promise2 = Promise.resolve('second')
      rerender({ p: promise2 })

      // Should reset to default
      expect(result.current).toBe(defaultValue)

      // Then resolve to new value
      await waitFor(() => {
        expect(result.current).toBe('second')
      })
    })

    it('should handle transition from resolved to new promise', async () => {
      const promise1 = Promise.resolve('first')
      const defaultValue = 'default'
      const { result, rerender } = renderHook(
        ({ p, def }) => usePromiseOrDefault(p, def),
        { initialProps: { p: promise1, def: defaultValue } }
      )

      await waitFor(() => {
        expect(result.current).toBe('first')
      })

      // New promise that rejects
      const promise2 = Promise.reject(new Error('error'))
      promise2.catch(() => {})

      rerender({ p: promise2, def: defaultValue })

      // Should reset to default
      expect(result.current).toBe(defaultValue)

      await new Promise((r) => setTimeout(r, 50))

      // Should stay at default after rejection
      expect(result.current).toBe(defaultValue)
    })
  })

  describe('render behavior', () => {
    it('should not cause excessive re-renders on initial mount', () => {
      let renderCount = 0

      const promise = new Promise<string>(() => {})
      renderHook(() => {
        renderCount++
        return usePromiseOrDefault(promise, 'default')
      })

      expect(renderCount).toBe(1) // Initial render only
    })

    it('should re-render when promise resolves', async () => {
      let renderCount = 0

      const promise = Promise.resolve('value')
      const { result } = renderHook(() => {
        renderCount++
        return usePromiseOrDefault(promise, 'default')
      })

      expect(renderCount).toBe(1) // Initial render

      await waitFor(() => {
        expect(result.current).toBe('value')
      })

      // Should have re-rendered for the resolved value
      expect(renderCount).toBe(2)
    })

    it('should re-render on promise reference change', async () => {
      let renderCount = 0

      const promise1 = Promise.resolve('first')
      const { rerender } = renderHook(
        ({ p }) => {
          renderCount++
          return usePromiseOrDefault(p, 'default')
        },
        { initialProps: { p: promise1 } }
      )

      const countAfterFirst = renderCount

      const promise2 = Promise.resolve('second')
      rerender({ p: promise2 })

      // Should cause re-renders (rerender itself + cleanup effect)
      expect(renderCount).toBeGreaterThan(countAfterFirst)
    })
  })

  describe('cleanup behavior', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: string) => void
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve
      })

      const defaultValue = 'default'
      const { result, unmount } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)

      // Unmount before resolving
      unmount()

      // Resolve after unmount
      resolvePromise!('should-not-update')

      await new Promise((r) => setTimeout(r, 50))

      // State should still be default (not updated after unmount)
      expect(result.current).toBe(defaultValue)
    })

    it('should reset to default on cleanup', async () => {
      const promise1 = Promise.resolve('first')
      const defaultValue = 'default'
      const { result, rerender } = renderHook(
        ({ p }) => usePromiseOrDefault(p, defaultValue),
        { initialProps: { p: promise1 } }
      )

      await waitFor(() => {
        expect(result.current).toBe('first')
      })

      // Change promise - cleanup runs before new effect
      const promise2 = new Promise<string>(() => {}) // never resolves
      rerender({ p: promise2 })

      // State resets to default
      expect(result.current).toBe(defaultValue)
    })
  })

  describe('edge cases', () => {
    it('should handle null as default value', async () => {
      const promise = Promise.resolve('value')
      const { result } = renderHook(() => usePromiseOrDefault(promise, null))

      expect(result.current).toBe(null)

      await waitFor(() => {
        expect(result.current).toBe('value')
      })
    })

    it('should handle undefined as resolved value', async () => {
      const promise = Promise.resolve(undefined)
      const defaultValue = 'default'
      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, defaultValue)
      )

      expect(result.current).toBe(defaultValue)

      await waitFor(() => {
        expect(result.current).toBeUndefined()
      })
    })

    it('should handle same promise and default value', async () => {
      const sharedValue = 'shared'
      const promise = Promise.resolve(sharedValue)
      const { result } = renderHook(() =>
        usePromiseOrDefault(promise, sharedValue)
      )

      expect(result.current).toBe(sharedValue)

      await waitFor(() => {
        expect(result.current).toBe(sharedValue)
      })

      // Value should remain the same
      expect(result.current).toBe(sharedValue)
    })
  })
})
