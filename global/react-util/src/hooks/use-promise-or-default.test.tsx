import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { renderHook, waitFor } from '@testing-library/react'

import { usePromiseOrDefault } from './use-promise-or-default'

describe('usePromiseOrDefault', () => {
  it('should return default initially and resolved value after resolution', async () => {
    const promise = Promise.resolve('resolved')
    const { result } = renderHook(() => usePromiseOrDefault(promise, 'default'))

    expect(result.current).toBe('default')

    await waitFor(() => {
      expect(result.current).toBe('resolved')
    })
  })

  it('should return default on rejection', async () => {
    const promise = Promise.reject(new Error('test'))
    // Prevent unhandled rejection
    promise.catch(() => {})

    const { result } = renderHook(() => usePromiseOrDefault(promise, 'fallback'))

    expect(result.current).toBe('fallback')

    await new Promise((r) => {
      setTimeout(r, 50)
    })
    expect(result.current).toBe('fallback')
  })

  it('should reset to default when promise reference changes', async () => {
    const promise1 = Promise.resolve('first')
    const defaultValue = 'default'
    const { result, rerender } = renderHook(({ p }) => usePromiseOrDefault(p, defaultValue), {
      initialProps: { p: promise1 },
    })

    await waitFor(() => {
      expect(result.current).toBe('first')
    })

    const promise2 = Promise.resolve('second')
    rerender({ p: promise2 })

    expect(result.current).toBe(defaultValue)

    await waitFor(() => {
      expect(result.current).toBe('second')
    })
  })

  it('should not update after unmount', async () => {
    let resolvePromise: (value: string) => void
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve
    })
    const { result, unmount } = renderHook(() => usePromiseOrDefault(promise, 'default'))

    unmount()
    resolvePromise!('should-not-update')

    await new Promise((r) => {
      setTimeout(r, 50)
    })
    expect(result.current).toBe('default')
  })

  it('should handle null default and undefined resolved value', async () => {
    const promise1 = Promise.resolve('value')
    const { result: result1 } = renderHook(() => usePromiseOrDefault(promise1, null))

    expect(result1.current).toBe(null)
    await waitFor(() => {
      expect(result1.current).toBe('value')
    })

    // eslint-disable-next-line unicorn/no-useless-undefined -- Promise.resolve(undefined) is needed for correct type inference
    const promise2 = Promise.resolve(undefined)
    const { result: result2 } = renderHook(() => usePromiseOrDefault(promise2, 'default'))

    await waitFor(() => {
      expect(result2.current).toBeUndefined()
    })
  })

  it('property: resolved value replaces default for any inputs', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string(), async (defaultVal, resolvedVal) => {
        const promise = Promise.resolve(resolvedVal)
        const { result, unmount } = renderHook(() => usePromiseOrDefault(promise, defaultVal))

        await waitFor(() => {
          expect(result.current).toBe(resolvedVal)
        })

        unmount()
      }),
      { numRuns: 20 }
    )
  })

  it('should trigger 2 renders on resolution (initial + resolved)', async () => {
    let renderCount = 0
    const promise = Promise.resolve('value')

    renderHook(() => {
      renderCount++
      return usePromiseOrDefault(promise, 'default')
    })

    expect(renderCount).toBe(1)

    await waitFor(
      () =>
        new Promise((r) => {
          setTimeout(r, 50)
        })
    )

    expect(renderCount).toBe(2)
  })
})
