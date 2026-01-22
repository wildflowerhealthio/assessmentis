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
  it('should start in loading state and transition to resolved', async () => {
    const promise = Promise.resolve('test-value')
    const { result } = renderHook(() => useLoadingPromise(promise))

    expect(result.current.loading).toBe(true)
    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBeUndefined()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBe('test-value')
    expect(result.current.error).toBeUndefined()
  })

  it('should transition to error state on rejection', async () => {
    const error = new Error('test error')
    const promise = Promise.reject(error)
    const { result } = renderHook(() => useLoadingPromise(promise))

    promise.catch(() => {})

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.value).toBeUndefined()
    expect(result.current.error).toBe(error)
  })

  it('should reset to loading when promise reference changes', async () => {
    const promise1 = Promise.resolve('first')
    const { result, rerender } = renderHook(({ p }) => useLoadingPromise(p), {
      initialProps: { p: promise1 },
    })

    await waitFor(() => {
      expect(result.current.value).toBe('first')
    })

    const promise2 = Promise.resolve('second')
    rerender({ p: promise2 })

    expect(result.current.loading).toBe(true)
    expect(result.current.value).toBeUndefined()

    await waitFor(() => {
      expect(result.current.value).toBe('second')
    })
  })

  it('should not update state after unmount', async () => {
    let resolvePromise: (value: string) => void
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve
    })
    const { result, unmount } = renderHook(() => useLoadingPromise(promise))

    expect(result.current.loading).toBe(true)

    unmount()
    resolvePromise!('should-not-update')

    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.loading).toBe(true)
  })

  describe('property: state mutual exclusivity', () => {
    it('should maintain exactly one active state at all times', async () => {
      const promise = Promise.resolve('value')
      const { result } = renderHook(() => useLoadingPromise(promise))

      const assertMutuallyExclusive = (state: LoadingPromiseState<string>) => {
        const activeStates = [
          state.loading,
          state.value !== undefined,
          state.error !== undefined,
        ].filter(Boolean)
        expect(activeStates.length).toBe(1)
      }

      assertMutuallyExclusive(result.current)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      assertMutuallyExclusive(result.current)
    })

    it('property: always resolves to correct value for any input', async () => {
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

  it('should trigger exactly 2 renders (initial + resolved)', async () => {
    let renderCount = 0
    const promise = Promise.resolve('value')

    renderHook(() => {
      renderCount++
      return useLoadingPromise(promise)
    })

    expect(renderCount).toBe(1)

    await waitFor(() => {
      return new Promise((r) => setTimeout(r, 50))
    })

    expect(renderCount).toBe(2)
  })
})
