import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import * as fc from 'fast-check'
import { useLoadingPromise, LoadingPromiseState } from './useLoadingPromise'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('useLoadingPromise', () => {
  describe('initial state', () => {
    it('should return loading: true initially', () => {
      const promise = new Promise<string>(() => {}) // never resolves
      const { result } = renderHook(() => useLoadingPromise(promise))

      expect(result.current.loading).toBe(true)
      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('promise resolution', () => {
    it('should return { value, loading: false } when promise resolves', async () => {
      const promise = Promise.resolve('test-value')
      const { result } = renderHook(() => useLoadingPromise(promise))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBe('test-value')
      expect(result.current.error).toBeUndefined()
    })

    it('property: resolved state contains the value', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (value) => {
          const promise = Promise.resolve(value)
          const { result, unmount } = renderHook(() =>
            useLoadingPromise(promise)
          )

          await waitFor(() => {
            expect(result.current.loading).toBe(false)
          })

          expect(result.current.value).toBe(value)
          expect(result.current.error).toBeUndefined()

          unmount()
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('promise rejection', () => {
    it('should return { error, loading: false } when promise rejects', async () => {
      const error = new Error('test error')
      const promise = Promise.reject(error)
      const { result } = renderHook(() => useLoadingPromise(promise))

      // Catch to avoid unhandled rejection
      promise.catch(() => {})

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBe(error)
    })

    it('should handle rejection with any error type', async () => {
      const stringError = 'string error'
      const promise = Promise.reject(stringError)
      const { result } = renderHook(() => useLoadingPromise(promise))

      promise.catch(() => {})

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBe(stringError)
    })
  })

  describe('promise reference changes', () => {
    it('should reset to loading state when promise reference changes', async () => {
      const promise1 = Promise.resolve('first')
      const { result, rerender } = renderHook(({ p }) => useLoadingPromise(p), {
        initialProps: { p: promise1 },
      })

      // Wait for first promise to resolve
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBe('first')

      // Change promise reference
      const promise2 = Promise.resolve('second')
      rerender({ p: promise2 })

      // Should be back to loading
      expect(result.current.loading).toBe(true)
      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBeUndefined()

      // Wait for second promise to resolve
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBe('second')
    })

    it('should handle transition from resolved to rejected', async () => {
      const promise1 = Promise.resolve('success')
      const { result, rerender } = renderHook(({ p }) => useLoadingPromise(p), {
        initialProps: { p: promise1 },
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBe('success')

      const error = new Error('failure')
      const promise2 = Promise.reject(error)
      promise2.catch(() => {})

      rerender({ p: promise2 })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBe(error)
    })
  })

  describe('state transitions', () => {
    it('property: exactly one state is active at any time', async () => {
      const promise = Promise.resolve('value')
      const { result } = renderHook(() => useLoadingPromise(promise))

      const assertMutuallyExclusive = (state: LoadingPromiseState<string>) => {
        const states = [
          state.loading,
          state.value !== undefined,
          state.error !== undefined,
        ].filter(Boolean)
        expect(states.length).toBe(1)
      }

      // Loading state
      assertMutuallyExclusive(result.current)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Value state
      assertMutuallyExclusive(result.current)
    })

    it('property: state transitions preserve mutual exclusivity through error', async () => {
      const error = new Error('test')
      const promise = Promise.reject(error)
      const { result } = renderHook(() => useLoadingPromise(promise))

      promise.catch(() => {})

      const assertMutuallyExclusive = (state: LoadingPromiseState<string>) => {
        const states = [
          state.loading,
          state.value !== undefined,
          state.error !== undefined,
        ].filter(Boolean)
        expect(states.length).toBe(1)
      }

      // Loading state
      assertMutuallyExclusive(result.current)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Error state
      assertMutuallyExclusive(result.current)
    })
  })

  describe('render behavior', () => {
    it('should not cause excessive re-renders', async () => {
      let renderCount = 0

      const promise = Promise.resolve('value')
      renderHook(() => {
        renderCount++
        return useLoadingPromise(promise)
      })

      expect(renderCount).toBe(1) // Initial render

      await waitFor(() => {
        // Wait for promise resolution
        return new Promise((r) => setTimeout(r, 50))
      })

      // Promise resolution triggers one re-render (loading -> resolved)
      expect(renderCount).toBe(2)
    })

    it('should re-render when promise reference changes', async () => {
      let renderCount = 0

      const promise1 = Promise.resolve('first')
      const { rerender } = renderHook(
        ({ p }) => {
          renderCount++
          return useLoadingPromise(p)
        },
        { initialProps: { p: promise1 } }
      )

      expect(renderCount).toBe(1) // Initial render

      await waitFor(() => {
        return new Promise((r) => setTimeout(r, 50))
      })

      const renderCountAfterFirst = renderCount

      // Change promise reference
      const promise2 = Promise.resolve('second')
      rerender({ p: promise2 })

      // Rerender itself causes one render, plus cleanup effect causes another
      expect(renderCount).toBeGreaterThan(renderCountAfterFirst)
    })
  })

  describe('cleanup behavior', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: string) => void
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve
      })

      const { result, unmount } = renderHook(() => useLoadingPromise(promise))

      expect(result.current.loading).toBe(true)

      // Unmount before resolving
      unmount()

      // Resolve after unmount
      resolvePromise!('should-not-update')

      await new Promise((r) => setTimeout(r, 50))

      // State should still be loading (not updated after unmount)
      expect(result.current.loading).toBe(true)
    })

    it('should reset to loading state on cleanup', async () => {
      const promise1 = Promise.resolve('first')
      const { result, rerender } = renderHook(({ p }) => useLoadingPromise(p), {
        initialProps: { p: promise1 },
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Change promise - cleanup runs before new effect
      const promise2 = new Promise<string>(() => {}) // never resolves
      rerender({ p: promise2 })

      // State resets to loading
      expect(result.current.loading).toBe(true)
      expect(result.current.value).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })
})
