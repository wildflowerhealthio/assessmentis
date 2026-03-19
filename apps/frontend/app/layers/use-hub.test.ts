import { it } from '@effect/vitest'
import { Effect, Either, Stream } from 'effect'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'

import { Patient } from '@assessmentis/clinical-domain'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { renderHook } from '@testing-library/react'

import { createMockHub, createMockPlatformContext } from '../test-utils'
import { usePlatformContext } from './platform-context'
import { useHub } from './use-hub'

// --- Mocks ---------------------------------------------------------------

vi.mock('./platform-context', () => ({
  usePlatformContext: vi.fn(),
}))

// --- Tests ---------------------------------------------------------------

describe('useHub', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Hub is correctly provided via PlatformContext', () => {
    it('returns the hub object from PlatformContext', () => {
      const mockHub = createMockHub()
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())

      expect(result.current).toBe(mockHub)
    })

    it('returns the hub provided by PlatformContext, not a default', () => {
      const customHub = createMockHub({
        get: vi.fn(() => Effect.succeed({ domainType: 'Patient' as const })),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: customHub }))

      const { result } = renderHook(() => useHub())

      expect(result.current).toBe(customHub)
    })

    it('updates when PlatformContext hub changes', () => {
      const firstHub = createMockHub()
      const secondHub = createMockHub({
        get: vi.fn(() => Effect.succeed({ domainType: 'Encounter' as const })),
      })

      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: firstHub }))

      const { result, rerender } = renderHook(() => useHub())
      expect(result.current).toBe(firstHub)

      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: secondHub }))
      rerender()

      expect(result.current).toBe(secondHub)
    })
  })

  describe('Hub methods are accessible and typed correctly', () => {
    it.each([
      { method: 'get' },
      { method: 'subscribe' },
      { method: 'search' },
      { method: 'subscribeSearch' },
      { method: 'create' },
      { method: 'update' },
      { method: 'delete' },
    ] as const)('exposes a $method method', ({ method }) => {
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext())
      const { result } = renderHook(() => useHub())

      expect(typeof result.current[method]).toBe('function')
    })

    it('get returns an Effect', () => {
      const mockResource = { domainType: 'Patient' as const }
      const mockHub = createMockHub({
        get: vi.fn(() => Effect.succeed(mockResource)),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())
      const getResult = result.current.get(
        Patient,

        {} as any
      )

      // Effect.succeed returns an effect — check it resolves correctly
      return Effect.runPromise(getResult).then((value) => {
        expect(value).toBe(mockResource)
      })
    })

    it('subscribe returns a Stream', () => {
      const mockResource = { domainType: 'Patient' as const }
      const mockHub = createMockHub({
        subscribe: vi.fn(() => Stream.succeed(Either.right(mockResource))),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())

      const stream = result.current.subscribe(Patient, {} as any)

      return Effect.runPromise(Stream.runCollect(stream)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(Either.right(mockResource))
      })
    })

    it('search returns an Effect resolving to an array', () => {
      const mockResults = [{ domainType: 'Patient' as const }]
      const mockHub = createMockHub({
        search: vi.fn(() => Effect.succeed(mockResults)),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())
      const searchResult = result.current.search(Patient)

      return Effect.runPromise(searchResult).then((value) => {
        expect(value).toBe(mockResults)
      })
    })

    it('subscribeSearch returns a Stream of Either', () => {
      const mockResults = [{ domainType: 'Patient' as const }]
      const mockHub = createMockHub({
        subscribeSearch: vi.fn(() => Stream.succeed(Either.right(mockResults))),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())
      const stream = result.current.subscribeSearch(Patient)

      return Effect.runPromise(Stream.runCollect(stream)).then((chunk) => {
        const items = [...chunk]
        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(Either.right(mockResults))
      })
    })

    it('create returns an Effect with the created resource', () => {
      const newResource = { domainType: 'Patient' as const }
      const createdResource = {
        ...newResource,
        url: 'https://example.com/Patient/1',
      }
      const mockHub = createMockHub({
        create: vi.fn(() => Effect.succeed(createdResource)),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())

      const createResult = result.current.create(Patient, newResource as any)

      return Effect.runPromise(createResult).then((value) => {
        expect(value).toBe(createdResource)
      })
    })

    it('update returns an Effect with the updated resource', () => {
      const resource = {
        domainType: 'Patient' as const,
        url: 'https://example.com/Patient/1',
      }
      const mockHub = createMockHub({
        update: vi.fn(() => Effect.succeed(resource)),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())

      const updateResult = result.current.update(Patient, resource as any)

      return Effect.runPromise(updateResult).then((value) => {
        expect(value).toBe(resource)
      })
    })

    it('delete returns an Effect resolving to void', () => {
      const mockHub = createMockHub({
        delete: vi.fn(() => Effect.void),
      })
      vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

      const { result } = renderHook(() => useHub())

      const deleteResult = result.current.delete(Patient, {} as any)

      return Effect.runPromise(deleteResult).then((value) => {
        expect(value).toBeUndefined()
      })
    })
  })

  describe('Hub method invocations pass through correctly', () => {
    it.effect('calls get with the provided class and url', () =>
      Effect.gen(function* () {
        const getFn = vi.fn(() => Effect.succeed({}))
        const mockHub = createMockHub({ get: getFn })
        vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

        const { result } = renderHook(() => useHub())

        const fakeUrl = {
          toString: () => 'https://example.com/Patient/1',
        } as any
        yield* result.current.get(Patient, fakeUrl)

        expect(getFn).toHaveBeenCalledWith(Patient, fakeUrl)
      })
    )

    it.effect('calls subscribe with the provided class and url', () =>
      Effect.gen(function* () {
        const subscribeFn = vi.fn(() => Stream.succeed(Either.right({})))
        const mockHub = createMockHub({ subscribe: subscribeFn })
        vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

        const { result } = renderHook(() => useHub())

        const fakeUrl = {
          toString: () => 'https://example.com/Patient/1',
        } as any as ReadonlyUrl
        yield* result.current.subscribe(Patient, fakeUrl).pipe(Stream.runCollect)

        expect(subscribeFn).toHaveBeenCalledWith(Patient, fakeUrl)
      })
    )

    it.effect('calls delete with the provided class and url', () =>
      Effect.gen(function* () {
        const deleteFn = vi.fn(() => Effect.void)
        const mockHub = createMockHub({ delete: deleteFn })
        vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

        const { result } = renderHook(() => useHub())

        const fakeUrl = {
          toString: () => 'https://example.com/Patient/1',
        } as any
        yield* result.current.delete(Patient, fakeUrl)

        expect(deleteFn).toHaveBeenCalledWith(Patient, fakeUrl)
      })
    )
  })
})
