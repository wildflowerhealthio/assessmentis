import { Effect, Either, Stream } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Encounter, Patient } from '@assessmentis/clinical-domain'
import { NotFoundError } from '@assessmentis/ontology'

import { renderHook } from '@testing-library/react'

import { createMockHub, createMockPlatformContext } from '../test-utils'
import { usePlatformContext } from './platform-context'
import { useResourceSubscription } from './use-resource-subscription'

// --- Mocks ---------------------------------------------------------------

vi.mock('./platform-context', () => ({
  usePlatformContext: vi.fn(),
}))

// --- Helpers -------------------------------------------------------------

// A valid absolute URL string that ReadonlyUrl.FromString can parse
const VALID_PATIENT_URL = 'https://example.com/Patient/123'
const VALID_ENCOUNTER_URL = 'https://example.com/Encounter/456'

// An invalid string that fails URL parsing
const INVALID_URL = 'not-a-valid-url'

// --- Tests ---------------------------------------------------------------

describe('useResourceSubscription', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Valid URL produces a subscription stream', () => {
    it('calls hub.subscribe with the decoded URL when rawId is a valid URL string', () => {
      const subscribeFn = vi.fn(() =>
        Stream.succeed(Either.right({ domainType: 'Patient' as const }))
      )
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      renderHook(() => useResourceSubscription(Patient, VALID_PATIENT_URL))

      expect(subscribeFn).toHaveBeenCalledWith(
        Patient,
        expect.objectContaining({
          host: 'example.com',
          pathname: '/Patient/123',
          protocol: 'https:',
        })
      )
    })

    it('returns the stream from hub.subscribe for a valid URL', () => {
      const mockPatient = { domainType: 'Patient' as const, name: [] }
      const expectedStream = Stream.succeed(Either.right(mockPatient))
      const mockHub = createMockHub({
        subscribe: vi.fn(() => expectedStream),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, VALID_PATIENT_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(Either.right(mockPatient))
      })
    })

    it('passes the correct domainType (Patient) to hub.subscribe', () => {
      const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      renderHook(() => useResourceSubscription(Patient, VALID_PATIENT_URL))

      expect(subscribeFn).toHaveBeenCalledWith(Patient, expect.anything())
    })

    it('passes the correct domainType (Encounter) to hub.subscribe', () => {
      const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      renderHook(() => useResourceSubscription(Encounter, VALID_ENCOUNTER_URL))

      expect(subscribeFn).toHaveBeenCalledWith(Encounter, expect.anything())
    })

    it('does not call hub.subscribe when rawId is invalid', () => {
      const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      expect(subscribeFn).not.toHaveBeenCalled()
    })

    it('memoizes the stream and does not re-call subscribe on re-render with same rawId', () => {
      const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { rerender } = renderHook(() => useResourceSubscription(Patient, VALID_PATIENT_URL))

      rerender()
      rerender()

      // Called exactly once due to useMemo
      expect(subscribeFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Invalid URL produces NotFoundError', () => {
    it('returns a Stream when rawId is not a valid URL', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      // The result must be a Stream (has a _tag or is an object)
      expect(result.current).toBeDefined()
    })

    it('emits a Left(NotFoundError) for an invalid URL', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)

        const item = items[0]
        expect(Either.isLeft(item)).toBe(true)

        if (Either.isLeft(item)) {
          expect(item.left).toBeInstanceOf(NotFoundError)
        }
      })
    })

    it('NotFoundError contains the correct resourceType (Patient)', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        const item = items[0]

        if (Either.isLeft(item)) {
          const error = item.left as unknown as NotFoundError<string, { unparsableUrl: string }>
          expect(error.resourceType).toBe('Patient')
        } else {
          throw new Error('Expected a Left, got Right')
        }
      })
    })

    it('NotFoundError params contain the original rawId URL string', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        const item = items[0]

        if (Either.isLeft(item)) {
          const error = item.left as unknown as NotFoundError<string, { unparsableUrl: string }>
          expect(error.params.unparsableUrl).toBe(INVALID_URL)
        } else {
          throw new Error('Expected a Left, got Right')
        }
      })
    })

    it('NotFoundError has the NotFoundError _tag', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, INVALID_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        const item = items[0]

        if (Either.isLeft(item)) {
          expect(item.left._tag).toBe('NotFoundError')
        } else {
          throw new Error('Expected a Left, got Right')
        }
      })
    })

    it('returns NotFoundError for an empty string rawId', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Patient, ''))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(Either.isLeft(items[0])).toBe(true)

        if (Either.isLeft(items[0])) {
          expect(items[0].left._tag).toBe('NotFoundError')
        }
      })
    })

    it('returns the stream without error for Encounter with a valid URL', () => {
      const mockEncounter = { domainType: 'Encounter' as const }
      const mockHub = createMockHub({
        subscribe: vi.fn(() => Stream.succeed(Either.right(mockEncounter))),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Encounter, VALID_ENCOUNTER_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(Either.isRight(items[0])).toBe(true)
      })
    })

    it('emits NotFoundError for Encounter with an invalid URL', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useResourceSubscription(Encounter, INVALID_URL))

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)

        if (Either.isLeft(items[0])) {
          const error = items[0].left as unknown as NotFoundError<string, { unparsableUrl: string }>
          expect(error._tag).toBe('NotFoundError')
          expect(error.resourceType).toBe('Encounter')
        } else {
          throw new Error('Expected a Left, got Right')
        }
      })
    })

    it('re-creates the error stream when rawId changes to an invalid value', () => {
      const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
      const mockHub = createMockHub({ subscribe: subscribeFn })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result, rerender } = renderHook(
        ({ rawId }: { rawId: string }) => useResourceSubscription(Patient, rawId),
        { initialProps: { rawId: VALID_PATIENT_URL } }
      )

      // Initially called with valid URL — subscribe should have been invoked
      expect(subscribeFn).toHaveBeenCalledTimes(1)

      // Now switch to an invalid rawId
      rerender({ rawId: INVALID_URL })

      return Effect.runPromise(Stream.runCollect(result.current)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(Either.isLeft(items[0])).toBe(true)

        if (Either.isLeft(items[0])) {
          expect(items[0].left._tag).toBe('NotFoundError')
        }
      })
    })
  })
})
