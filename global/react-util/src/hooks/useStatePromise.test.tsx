import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import * as fc from 'fast-check'
import { useStatePromise } from './effectHooks'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('useStatePromise', () => {
  describe('initial state', () => {
    it('should return a pending promise on initial render', async () => {
      const { result } = renderHook(() => useStatePromise<number>())
      const [promise] = result.current

      // Verify promise is pending by racing with a timeout
      let resolved = false
      promise.then(() => {
        resolved = true
      })

      // Give microtask queue time to process
      await new Promise((r) => setTimeout(r, 10))
      expect(resolved).toBe(false)
    })

    it('should return stable callbacks across re-renders', () => {
      const { result, rerender } = renderHook(() => useStatePromise<number>())
      const [, callbacks1] = result.current

      rerender()

      const [, callbacks2] = result.current
      expect(callbacks1.resolve).toBe(callbacks2.resolve)
      expect(callbacks1.reject).toBe(callbacks2.reject)
      expect(callbacks1.reset).toBe(callbacks2.reset)
      expect(callbacks1.map).toBe(callbacks2.map)
    })

    it('should have all required callback methods', () => {
      const { result } = renderHook(() => useStatePromise<number>())
      const [, callbacks] = result.current

      expect(typeof callbacks.resolve).toBe('function')
      expect(typeof callbacks.reject).toBe('function')
      expect(typeof callbacks.reset).toBe('function')
      expect(typeof callbacks.map).toBe('function')
    })
  })

  describe('resolve behavior', () => {
    it('should resolve the promise with the provided value', async () => {
      const { result } = renderHook(() => useStatePromise<string>())

      act(() => {
        result.current[1].resolve('test-value')
      })

      await expect(result.current[0]).resolves.toBe('test-value')
    })

    it('should create a new promise when resolve is called after already resolved', async () => {
      const { result } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      // First resolve - does NOT call setPromise, so promise identity stays same
      await act(async () => {
        result.current[1].resolve(1)
      })

      const promise2 = result.current[0]
      // First resolve doesn't change promise identity (no setPromise call)
      expect(promise2).toBe(promise1)

      // Second resolve - DOES call setPromise since resolvedRef is now true
      await act(async () => {
        result.current[1].resolve(2)
      })

      const promise3 = result.current[0]

      // Second resolve creates a new promise
      expect(promise3).not.toBe(promise2)

      await expect(promise3).resolves.toBe(2)
    })

    it('should maintain promise identity until resolved', () => {
      const { result, rerender } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      // Rerender without resolving
      rerender()
      const promise2 = result.current[0]

      rerender()
      const promise3 = result.current[0]

      expect(promise1).toBe(promise2)
      expect(promise2).toBe(promise3)
    })

    it('property: resolve with any value resolves the promise to that value', async () => {
      await fc.assert(
        fc.asyncProperty(fc.anything(), async (value) => {
          const { result } = renderHook(() => useStatePromise<unknown>())

          await act(async () => {
            result.current[1].resolve(value)
          })

          const resolved = await result.current[0]
          expect(resolved).toEqual(value)
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('reject behavior', () => {
    it('should reject the promise with the provided reason', async () => {
      const { result } = renderHook(() => useStatePromise<string>())
      const error = new Error('test error')

      act(() => {
        result.current[1].reject(error)
      })

      await expect(result.current[0]).rejects.toBe(error)
    })

    it('should create a new promise when reject is called after already resolved', async () => {
      const { result } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      // First resolve - sets resolvedRef to true but doesn't call setPromise
      await act(async () => {
        result.current[1].resolve(1)
      })

      const promise2 = result.current[0]
      // First resolve doesn't change promise identity
      expect(promise2).toBe(promise1)

      // Now reject - since resolvedRef is true, creates new promise
      act(() => {
        result.current[1].reject(new Error('test'))
      })

      // Catch to avoid unhandled rejection
      result.current[0].catch(() => {})

      const promise3 = result.current[0]

      // Reject after resolution creates new promise
      expect(promise3).not.toBe(promise2)
    })

    it('should create a new promise when reject is called after already rejected', async () => {
      const { result } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      // First reject - sets resolvedRef to true but doesn't call setPromise
      act(() => {
        result.current[1].reject(new Error('first'))
      })

      // Catch to avoid unhandled rejection
      result.current[0].catch(() => {})

      const promise2 = result.current[0]
      // First reject doesn't change promise identity
      expect(promise2).toBe(promise1)

      // Second reject - since resolvedRef is true, creates new promise
      act(() => {
        result.current[1].reject(new Error('second'))
      })

      result.current[0].catch(() => {})

      const promise3 = result.current[0]

      // Second reject creates new promise
      expect(promise3).not.toBe(promise2)
    })
  })

  describe('reset behavior', () => {
    it('should do nothing if promise is still pending', () => {
      const { result } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      act(() => {
        result.current[1].reset()
      })

      const promise2 = result.current[0]

      // Promise should not change when reset called while pending
      expect(promise1).toBe(promise2)
    })

    it('should create a new pending promise after resolution', async () => {
      const { result } = renderHook(() => useStatePromise<number>())

      const promise1 = result.current[0]

      // First resolve - sets resolvedRef to true
      await act(async () => {
        result.current[1].resolve(42)
      })

      const promise2 = result.current[0]
      // First resolve doesn't change promise identity
      expect(promise2).toBe(promise1)

      // Reset - since resolvedRef is true, creates new promise
      act(() => {
        result.current[1].reset()
      })

      const promise3 = result.current[0]

      // Reset creates a new promise
      expect(promise3).not.toBe(promise2)

      // New promise should be pending
      let resolved = false
      promise3.then(() => {
        resolved = true
      })
      await new Promise((r) => setTimeout(r, 10))
      expect(resolved).toBe(false)
    })
  })

  describe('map behavior', () => {
    describe('when promise is resolved', () => {
      it('should chain the transform via .then()', async () => {
        const { result } = renderHook(() => useStatePromise<number>())

        await act(async () => {
          result.current[1].resolve(10)
        })

        act(() => {
          result.current[1].map((x) => x * 2)
        })

        await expect(result.current[0]).resolves.toBe(20)
      })

      it('should apply multiple maps in sequence', async () => {
        const { result } = renderHook(() => useStatePromise<number>())

        await act(async () => {
          result.current[1].resolve(5)
        })

        act(() => {
          result.current[1].map((x) => x + 1) // 6
          result.current[1].map((x) => x * 2) // 12
        })

        await expect(result.current[0]).resolves.toBe(12)
      })
    })

    describe('when promise is pending', () => {
      it('should accumulate transforms in mappingRef', async () => {
        const { result } = renderHook(() => useStatePromise<number>())

        // Accumulate maps while pending - these are stored in mappingRef
        // but note: the current implementation does NOT apply mappingRef on resolve
        act(() => {
          result.current[1].map((x) => x + 1)
          result.current[1].map((x) => x * 2)
        })

        await act(async () => {
          result.current[1].resolve(5)
        })

        // Current implementation resolves with the raw value
        // (mappingRef is accumulated but not applied on resolve)
        await expect(result.current[0]).resolves.toBe(5)
      })

      it('should allow map after resolve to transform value', async () => {
        const { result } = renderHook(() => useStatePromise<number>())

        // First resolve
        await act(async () => {
          result.current[1].resolve(5)
        })

        // Map after resolve chains via .then()
        act(() => {
          result.current[1].map((x) => x * 2)
        })

        await expect(result.current[0]).resolves.toBe(10)
      })
    })
  })

  describe('render optimization', () => {
    it('should not cause excessive re-renders from map calls', () => {
      let renderCount = 0

      const { result } = renderHook(() => {
        renderCount++
        return useStatePromise<number>()
      })

      expect(renderCount).toBe(1) // Initial render

      // Calling map should not cause re-render when pending
      act(() => {
        result.current[1].map((x) => x + 1)
        result.current[1].map((x) => x * 2)
      })

      expect(renderCount).toBe(1) // Still 1
    })

    it('should re-render when promise changes via second resolve', async () => {
      let renderCount = 0

      const { result } = renderHook(() => {
        renderCount++
        return useStatePromise<number>()
      })

      expect(renderCount).toBe(1)

      // First resolve - does NOT call setPromise, so no re-render
      await act(async () => {
        result.current[1].resolve(42)
      })

      expect(renderCount).toBe(1) // Still 1

      // Second resolve - DOES call setPromise, triggering re-render
      await act(async () => {
        result.current[1].resolve(43)
      })

      expect(renderCount).toBeGreaterThan(1)
    })
  })
})
