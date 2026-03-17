import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, Either, Stream } from 'effect'

import { Media, Patient } from '@assessmentis/clinical-domain'

import { renderHook } from '@testing-library/react'

import { createMockHub, createMockPlatformContext } from '../test-utils'
import { usePlatformContext } from './PlatformContext'
import { useSearchSubscription } from './useSearchSubscription'

// --- Mocks ---------------------------------------------------------------

vi.mock('./PlatformContext', () => ({
  usePlatformContext: vi.fn(),
}))

// --- Tests ---------------------------------------------------------------

describe('useSearchSubscription', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls hub.subscribeSearch with the correct domainType', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({ hub: mockHub })
    )

    renderHook(() => useSearchSubscription(Patient))

    expect(subscribeSearchFn).toHaveBeenCalledWith(Patient, undefined)
  })

  it('passes filters to hub.subscribeSearch', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({ hub: mockHub })
    )

    const filters = { name: 'Smith' }
    renderHook(() => useSearchSubscription(Patient, filters))

    expect(subscribeSearchFn).toHaveBeenCalledWith(Patient, filters)
  })

  it('returns the stream from hub.subscribeSearch', () => {
    const mockPatients = [{ domainType: 'Patient' as const, name: [] }]
    const expectedStream = Stream.succeed(Either.right(mockPatients))
    const mockHub = createMockHub({
      subscribeSearch: vi.fn(() => expectedStream),
    })
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({ hub: mockHub })
    )

    const { result } = renderHook(() => useSearchSubscription(Patient))

    return Effect.runPromise(Stream.runCollect(result.current)).then(
      (chunk) => {
        const items = Array.from(chunk)
        expect(items).toHaveLength(1)
        expect(items[0]).toEqual(Either.right(mockPatients))
      }
    )
  })

  it('memoizes the stream on re-render with same inputs', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({ hub: mockHub })
    )

    const filters = { name: 'Smith' }
    const { rerender } = renderHook(() =>
      useSearchSubscription(Patient, filters)
    )

    rerender()
    rerender()

    expect(subscribeSearchFn).toHaveBeenCalledTimes(1)
  })

  it('works with different resource types', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(
      createMockPlatformContext({ hub: mockHub })
    )

    const filters = { encounter: 'Encounter/123' }
    renderHook(() => useSearchSubscription(Media, filters))

    expect(subscribeSearchFn).toHaveBeenCalledWith(Media, filters)
  })
})
