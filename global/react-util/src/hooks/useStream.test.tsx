import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { Cause, Effect, Queue, Stream } from 'effect'
import { useStream } from './effectHooks'

// Ensure DOM globals are available when tests run outside jsdom-configured env
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window as unknown as typeof globalThis.window
globalThis.document = dom.window.document

describe('useStream', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('subscription lifecycle', () => {
    it('should subscribe to stream on mount', async () => {
      let subscribed = false

      const testStream = Stream.fromEffect(
        Effect.sync(() => {
          subscribed = true
          return 42
        })
      )

      renderHook(() => useStream(testStream))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(subscribed).toBe(true)
    })

    it('should interrupt fiber on unmount', async () => {
      let interrupted = false

      const testStream = Stream.fromEffect(
        Effect.gen(function* () {
          yield* Effect.addFinalizer(() =>
            Effect.sync(() => {
              interrupted = true
            })
          )
          yield* Effect.never
        })
      )

      const { unmount } = renderHook(() => useStream(testStream))

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

  describe('value emission', () => {
    it('should resolve promise with emitted values', async () => {
      const testStream = Stream.make(42)

      const { result } = renderHook(() => useStream(testStream))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      await expect(result.current).resolves.toBe(42)
    })

    it('should update promise for each new emission', async () => {
      // Create a stream that emits multiple values
      const testStream = Stream.make(1, 2, 3)

      const { result } = renderHook(() => useStream(testStream))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })

      // Last emitted value should be accessible
      await expect(result.current).resolves.toBe(3)
    })
  })

  describe('error handling', () => {
    it('should reject with single failure', async () => {
      const error = new Error('stream error')
      const testStream = Stream.fail(error)

      const { result, unmount } = renderHook(() => useStream(testStream))

      // Catch early to prevent unhandled rejection warnings
      const errorPromise = result.current.catch((e) => e)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const caught = await errorPromise
      expect(caught).toBe(error)

      unmount()
    })

    it('should handle parallel cause from stream (wrapped by runForEach)', async () => {
      const errors = [new Error('error1'), new Error('error2')]

      // Create a cause with multiple parallel failures
      // Note: Stream.failCause combined with runForEach may wrap the cause,
      // resulting in different behavior than Effect.failCause
      const cause = Cause.parallel(Cause.fail(errors[0]), Cause.fail(errors[1]))
      const testStream = Stream.failCause(cause)

      const { result, unmount } = renderHook(() => useStream(testStream))

      // Catch early to prevent unhandled rejection
      const errorPromise = result.current.catch((e) => e)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      const e = await errorPromise

      // Stream processing may extract failures differently;
      // verify we get at least one of the errors
      expect(e).toBeInstanceOf(Error)
      expect([errors[0], errors[1]]).toContainEqual(e)

      unmount()
    })

    it('should reject with AggregateError for defects', async () => {
      const defect = new Error('defect')
      const testStream = Stream.die(defect)

      const { result, unmount } = renderHook(() => useStream(testStream))

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

    it('should ignore interruption (not reject)', async () => {
      let wasRejected = false

      const testStream = Stream.fromEffect(Effect.never)

      const { result, unmount } = renderHook(() => useStream(testStream))

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

      // Should NOT have rejected due to interruption
      expect(wasRejected).toBe(false)
    })
  })

  describe('render behavior', () => {
    it('should not re-render on first emission (promise resolves in place)', async () => {
      let renderCount = 0

      const testStream = Stream.make(42)

      renderHook(() => {
        renderCount++
        return useStream(testStream)
      })

      expect(renderCount).toBe(1) // Initial render

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      // First emission does NOT trigger re-render
      // (resolve() doesn't call setPromise on first call)
      expect(renderCount).toBe(1)
    })

    it('should re-render on second and subsequent emissions', async () => {
      let renderCount = 0

      // Create a controlled stream using a Queue
      const program = Effect.gen(function* () {
        const queue = yield* Queue.unbounded<number>()
        return { queue, stream: Stream.fromQueue(queue) }
      })

      const { queue, stream } = Effect.runSync(program)

      const { result } = renderHook(() => {
        renderCount++
        return useStream(stream)
      })

      expect(renderCount).toBe(1) // Initial render

      // First emission - no re-render
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 1))
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(renderCount).toBe(1) // Still 1
      await expect(result.current).resolves.toBe(1)

      // Second emission - triggers re-render
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 2))
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(renderCount).toBe(2) // Now 2
      await expect(result.current).resolves.toBe(2)

      // Third emission - triggers another re-render
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 3))
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(renderCount).toBe(3) // Now 3
      await expect(result.current).resolves.toBe(3)

      // Shutdown the queue
      Effect.runSync(Queue.shutdown(queue))
    })

    it('should provide new promise identity on each emission after first', async () => {
      const program = Effect.gen(function* () {
        const queue = yield* Queue.unbounded<number>()
        return { queue, stream: Stream.fromQueue(queue) }
      })

      const { queue, stream } = Effect.runSync(program)

      const { result } = renderHook(() => useStream(stream))

      const promisesBefore: Promise<number>[] = []

      // Capture initial promise
      promisesBefore.push(result.current)

      // First emission
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 1))
        await new Promise((r) => setTimeout(r, 50))
      })

      const promiseAfterFirst = result.current
      // First emission doesn't change promise identity
      expect(promiseAfterFirst).toBe(promisesBefore[0])

      // Second emission
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 2))
        await new Promise((r) => setTimeout(r, 50))
      })

      const promiseAfterSecond = result.current
      // Second emission creates new promise
      expect(promiseAfterSecond).not.toBe(promiseAfterFirst)

      // Third emission
      await act(async () => {
        Effect.runSync(Queue.offer(queue, 3))
        await new Promise((r) => setTimeout(r, 50))
      })

      const promiseAfterThird = result.current
      // Third emission creates another new promise
      expect(promiseAfterThird).not.toBe(promiseAfterSecond)

      Effect.runSync(Queue.shutdown(queue))
    })

    it('should track all emitted values through promise resolution', async () => {
      const emittedValues: number[] = []

      const program = Effect.gen(function* () {
        const queue = yield* Queue.unbounded<number>()
        return { queue, stream: Stream.fromQueue(queue) }
      })

      const { queue, stream } = Effect.runSync(program)

      const { result } = renderHook(() => useStream(stream))

      // Emit values and track what we receive
      for (const value of [10, 20, 30, 40]) {
        await act(async () => {
          Effect.runSync(Queue.offer(queue, value))
          await new Promise((r) => setTimeout(r, 30))
        })

        const resolved = await result.current
        emittedValues.push(resolved)
      }

      // Each emission should have been captured
      expect(emittedValues).toEqual([10, 20, 30, 40])

      Effect.runSync(Queue.shutdown(queue))
    })

    it('should handle rapid emissions and receive final value', async () => {
      // Stream that emits values with small delays
      const testStream = Stream.fromIterable([1, 2, 3, 4, 5]).pipe(
        Stream.tap(() => Effect.sleep('10 millis'))
      )

      let renderCount = 0
      const { result } = renderHook(() => {
        renderCount++
        return useStream(testStream)
      })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 200))
      })

      // Should have received the last value
      await expect(result.current).resolves.toBe(5)

      // React may batch rapid state updates, so we just verify
      // that re-renders occurred (more than initial render)
      // and the final value was received correctly
      expect(renderCount).toBeGreaterThan(1)
    })
  })

  describe('stream completion', () => {
    it('should handle empty streams', async () => {
      const testStream = Stream.empty

      const { result } = renderHook(() => useStream(testStream))

      // Promise should remain pending for empty stream (no emissions)
      let resolved = false
      result.current.then(() => {
        resolved = true
      })

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(resolved).toBe(false)
    })

    it('should log successful completion', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const testStream = Stream.make(1)

      renderHook(() => useStream(testStream))

      await act(async () => {
        await new Promise((r) => setTimeout(r, 100))
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stream completed successfully:',
        undefined
      )
    })
  })
})
