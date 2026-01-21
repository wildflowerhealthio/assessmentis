import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import * as fc from 'fast-check'
import { Cause, Effect } from 'effect'
import { useEffectTs } from './effectHooks'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('useEffectTs', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('effect execution', () => {
    it('should run effect on mount', async () => {
      let executed = false

      const testEffect = Effect.sync(() => {
        executed = true
        return 42
      })

      renderHook(() => useEffectTs(testEffect))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(executed).toBe(true)
    })

    it('should resolve promise with effect result', async () => {
      const testEffect = Effect.succeed(42)

      const { result } = renderHook(() => useEffectTs(testEffect))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      await expect(result.current).resolves.toBe(42)
    })

    it('property: successful effect resolves promise correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (value) => {
          const testEffect = Effect.succeed(value)

          const { result, unmount } = renderHook(() => useEffectTs(testEffect))

          await act(async () => {
            await new Promise((r) => setTimeout(r, 50))
          })

          await expect(result.current).resolves.toBe(value)

          unmount()
        }),
        { numRuns: 10 }
      )
    })
  })

  describe('error handling', () => {
    it('should reject with single failure', async () => {
      const error = new Error('effect error')
      const testEffect = Effect.fail(error)

      const { result, unmount } = renderHook(() => useEffectTs(testEffect))

      // Catch early to prevent unhandled rejection warnings
      const errorPromise = result.current.catch((e) => e)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const caught = await errorPromise
      expect(caught).toBe(error)

      unmount()
    })

    it('should reject with AggregateError for multiple failures', async () => {
      const errors = [new Error('error1'), new Error('error2')]

      const cause = Cause.parallel(Cause.fail(errors[0]), Cause.fail(errors[1]))
      const testEffect = Effect.failCause(cause)

      const { result, unmount } = renderHook(() => useEffectTs(testEffect))

      // Catch early to prevent unhandled rejection warnings
      const errorPromise = result.current.catch((e) => e)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const e = await errorPromise

      expect(e).toBeInstanceOf(AggregateError)
      expect((e as AggregateError).errors).toHaveLength(2)

      unmount()
    })

    it('should reject with AggregateError for defects', async () => {
      const defect = new Error('defect')
      const testEffect = Effect.die(defect)

      const { result, unmount } = renderHook(() => useEffectTs(testEffect))

      // Catch early to prevent unhandled rejection warnings
      const errorPromise = result.current.catch((e) => e)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const e = await errorPromise

      expect(e).toBeInstanceOf(AggregateError)
      expect((e as AggregateError).errors).toContain(defect)

      unmount()
    })

    it('should ignore interruption', async () => {
      let wasRejected = false

      const testEffect = Effect.never

      const { result, unmount } = renderHook(() => useEffectTs(testEffect))

      result.current.catch(() => {
        wasRejected = true
      })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      unmount()

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })

      expect(wasRejected).toBe(false)
    })
  })

  describe('cleanup behavior', () => {
    it('should interrupt fiber on unmount', async () => {
      let interrupted = false

      const testEffect = Effect.gen(function* () {
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            interrupted = true
          })
        )
        yield* Effect.never
      })

      const { unmount } = renderHook(() => useEffectTs(testEffect))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(interrupted).toBe(false)

      unmount()

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(interrupted).toBe(true)
    })
  })

  describe('effect changes', () => {
    it('should re-run effect when effect reference changes', async () => {
      let executionCount = 0

      const createEffect = (val: number) =>
        Effect.sync(() => {
          executionCount++
          return val
        })

      const { rerender, unmount } = renderHook(
        ({ effect }) => useEffectTs(effect),
        { initialProps: { effect: createEffect(1) } }
      )

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(executionCount).toBe(1)

      // Change effect reference
      rerender({ effect: createEffect(2) })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(executionCount).toBe(2)

      unmount()
    })

    it('should interrupt previous effect when new effect provided', async () => {
      let firstInterrupted = false

      const firstEffect = Effect.gen(function* () {
        yield* Effect.addFinalizer(() =>
          Effect.sync(() => {
            firstInterrupted = true
          })
        )
        yield* Effect.never
      })

      const secondEffect = Effect.succeed(42)

      const { rerender, unmount } = renderHook(
        ({ effect }) => useEffectTs(effect),
        { initialProps: { effect: firstEffect } }
      )

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(firstInterrupted).toBe(false)

      // Change to second effect
      rerender({ effect: secondEffect })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(firstInterrupted).toBe(true)

      unmount()
    })
  })

  describe('render behavior', () => {
    it('should not re-render on first effect completion (promise resolves in place)', async () => {
      let renderCount = 0

      const testEffect = Effect.succeed(42)

      renderHook(() => {
        renderCount++
        return useEffectTs(testEffect)
      })

      expect(renderCount).toBe(1) // Initial render

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // First completion does NOT trigger re-render
      // (resolve() doesn't call setPromise on first call)
      expect(renderCount).toBe(1)
    })

    it('should re-render when effect reference changes', async () => {
      let renderCount = 0

      const createEffect = (val: number) => Effect.succeed(val)

      const { rerender, unmount } = renderHook(
        ({ effect }) => {
          renderCount++
          return useEffectTs(effect)
        },
        { initialProps: { effect: createEffect(1) } }
      )

      expect(renderCount).toBe(1) // Initial render

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // First effect completion - no re-render
      expect(renderCount).toBe(1)

      const renderCountBeforeChange = renderCount

      // Change effect reference
      await act(async () => {
        rerender({ effect: createEffect(2) })
        await new Promise((r) => setTimeout(r, 100))
      })

      // Cleanup calls reset() which triggers setPromise, then new effect resolves
      // This causes re-renders beyond just the rerender call
      expect(renderCount).toBeGreaterThan(renderCountBeforeChange)

      unmount()
    })

    it('should provide new promise identity when effect reference changes', async () => {
      const createEffect = (val: number) => Effect.succeed(val)

      const { result, rerender, unmount } = renderHook(
        ({ effect }) => useEffectTs(effect),
        { initialProps: { effect: createEffect(1) } }
      )

      const initialPromise = result.current

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // First effect completion doesn't change promise identity
      const promiseAfterFirst = result.current
      expect(promiseAfterFirst).toBe(initialPromise)

      // Change effect reference
      rerender({ effect: createEffect(2) })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // New effect creates new promise (via cleanup reset + resolve)
      const promiseAfterSecond = result.current
      expect(promiseAfterSecond).not.toBe(promiseAfterFirst)

      // Change effect reference again
      rerender({ effect: createEffect(3) })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const promiseAfterThird = result.current
      expect(promiseAfterThird).not.toBe(promiseAfterSecond)

      unmount()
    })

    it('should resolve to first value successfully', async () => {
      const createEffect = (val: number) => Effect.succeed(val)

      const { result, unmount } = renderHook(
        ({ effect }) => useEffectTs(effect),
        { initialProps: { effect: createEffect(10) } }
      )

      // First effect
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // Verify first value resolves correctly
      await expect(result.current).resolves.toBe(10)

      unmount()
    })

    it('should handle delayed effect completion without extra re-renders', async () => {
      let renderCount = 0

      // Effect that takes some time to complete
      const delayedEffect = Effect.gen(function* () {
        yield* Effect.sleep('30 millis')
        return 42
      })

      const { result } = renderHook(() => {
        renderCount++
        return useEffectTs(delayedEffect)
      })

      expect(renderCount).toBe(1) // Initial render

      // Wait for effect to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })

      // First completion still doesn't trigger re-render
      expect(renderCount).toBe(1)
      await expect(result.current).resolves.toBe(42)
    })
  })

  describe('scoping', () => {
    it('should properly scope the effect (releases after effect completes)', async () => {
      let resourceAcquired = false
      let resourceReleased = false

      // Effect.scoped is applied by useEffectTs, which means
      // the scope closes after the effect completes (not on unmount)
      const testEffect = Effect.acquireRelease(
        Effect.sync(() => {
          resourceAcquired = true
          return 'resource'
        }),
        () =>
          Effect.sync(() => {
            resourceReleased = true
          })
      )

      const { unmount } = renderHook(() => useEffectTs(testEffect))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // Resource acquired and released (Effect.scoped closes scope after completion)
      expect(resourceAcquired).toBe(true)
      expect(resourceReleased).toBe(true)

      unmount()
    })
  })
})
