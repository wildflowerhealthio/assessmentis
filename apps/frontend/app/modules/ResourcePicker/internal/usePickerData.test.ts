import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, Either, Stream } from 'effect'

import { Patient } from '@assessmentis/clinical-domain'

import { renderHook, act } from '@testing-library/react'

import { createMockHub, createMockPlatformContext } from '../../../test-utils'
import { usePlatformContext } from '../../../layers/PlatformContext'

import { usePickerData } from './usePickerData'

// --- Mocks ---------------------------------------------------------------

vi.mock('../../../layers/PlatformContext', () => ({
  usePlatformContext: vi.fn(),
}))

// Capture the stream passed to useEitherStream so we can assert on it
// without needing a real Scope runtime.
let capturedStream: Stream.Stream<unknown, never, never> | undefined
vi.mock('@assessmentis/react-util', () => ({
  useEitherStream: (stream: Stream.Stream<unknown, never, never>) => {
    capturedStream = stream
    return Promise.resolve([])
  },
}))

// --- Helpers -------------------------------------------------------------

function setupMockHub(overrides: Parameters<typeof createMockHub>[0] = {}) {
  const mockHub = createMockHub(overrides)
  vi.mocked(usePlatformContext).mockReturnValue(
    createMockPlatformContext({ hub: mockHub })
  )
  return mockHub
}

async function collectStream(stream: Stream.Stream<unknown, never, never>) {
  const chunk = await Effect.runPromise(Stream.runCollect(stream))
  return Array.from(chunk)
}

// --- Tests ---------------------------------------------------------------

describe('usePickerData', () => {
  beforeEach(() => {
    capturedStream = undefined
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when enabled is true', () => {
    it('calls hub.subscribeSearch with the given klass', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      renderHook(() => usePickerData({ klass: Patient }))

      expect(subscribeSearchFn).toHaveBeenCalledWith(Patient)
    })

    it('defaults enabled to true when not specified', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      renderHook(() => usePickerData({ klass: Patient }))

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)
    })

    it('passes the hub stream to useEitherStream', () => {
      const mockPatients = [{ domainType: 'Patient' as const }]
      const expectedStream = Stream.succeed(Either.right(mockPatients))
      setupMockHub({ subscribeSearch: vi.fn(() => expectedStream) })

      renderHook(() => usePickerData({ klass: Patient, enabled: true }))

      expect(capturedStream).toBeDefined()
      return collectStream(capturedStream!).then((items) => {
        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(Either.right(mockPatients))
      })
    })

    it('returns a promise as the first element of the tuple', () => {
      setupMockHub()

      const { result } = renderHook(() =>
        usePickerData({ klass: Patient, enabled: true })
      )

      const [itemsPromise] = result.current
      expect(itemsPromise).toBeInstanceOf(Promise)
    })

    it('returns a refetch function as the second element of the tuple', () => {
      setupMockHub()

      const { result } = renderHook(() =>
        usePickerData({ klass: Patient, enabled: true })
      )

      const [, refetch] = result.current
      expect(typeof refetch).toBe('function')
    })
  })

  describe('when enabled is false', () => {
    it('does not call hub.subscribeSearch', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      renderHook(() => usePickerData({ klass: Patient, enabled: false }))

      expect(subscribeSearchFn).not.toHaveBeenCalled()
    })

    it('produces a stream with Left(Disabled) instead of resource data', () => {
      setupMockHub()

      renderHook(() => usePickerData({ klass: Patient, enabled: false }))

      expect(capturedStream).toBeDefined()
      return collectStream(capturedStream!).then((items) => {
        expect(items).toHaveLength(1)
        const item = items[0] as Either.Either<unknown, { _tag: string }>
        expect(Either.isLeft(item)).toBe(true)
        if (Either.isLeft(item)) {
          expect(item.left).toEqual({ _tag: 'Disabled' })
        }
      })
    })
  })

  describe('refetchTrigger causes re-subscription', () => {
    it('calls hub.subscribeSearch again when refetch is invoked', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      const { result } = renderHook(() =>
        usePickerData({ klass: Patient, enabled: true })
      )

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)

      act(() => {
        const [, refetch] = result.current
        refetch()
      })

      expect(subscribeSearchFn).toHaveBeenCalledTimes(2)
    })

    it('does not re-subscribe when re-rendered without refetch', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      const { rerender } = renderHook(() =>
        usePickerData({ klass: Patient, enabled: true })
      )

      rerender()
      rerender()

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('memoization', () => {
    it('memoizes the stream when inputs are stable', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      const { rerender } = renderHook(() => usePickerData({ klass: Patient }))

      rerender()
      rerender()

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)
    })

    it('re-creates the stream when enabled changes from false to true', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          usePickerData({ klass: Patient, enabled }),
        { initialProps: { enabled: false } }
      )

      expect(subscribeSearchFn).not.toHaveBeenCalled()

      rerender({ enabled: true })

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)
    })

    it('switches to Disabled stream when enabled changes from true to false', () => {
      const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
      setupMockHub({ subscribeSearch: subscribeSearchFn })

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          usePickerData({ klass: Patient, enabled }),
        { initialProps: { enabled: true } }
      )

      expect(subscribeSearchFn).toHaveBeenCalledTimes(1)

      rerender({ enabled: false })

      expect(capturedStream).toBeDefined()
      return collectStream(capturedStream!).then((items) => {
        expect(items).toHaveLength(1)
        const item = items[0] as Either.Either<unknown, { _tag: string }>
        expect(Either.isLeft(item)).toBe(true)
        if (Either.isLeft(item)) {
          expect(item.left).toEqual({ _tag: 'Disabled' })
        }
      })
    })
  })
})
