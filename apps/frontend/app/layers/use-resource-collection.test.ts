import { Effect, Either, Schema, Stream } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Encounter, Patient } from '@assessmentis/clinical-domain'
import { Search } from '@assessmentis/effectful-store'

import { renderHook } from '@testing-library/react'

import { createMockHub, createMockPlatformContext } from '../test-utils'
import { usePlatformContext } from './platform-context'
import { useResourceCollection } from './use-resource-collection'

// --- Mocks ---------------------------------------------------------------

vi.mock('./platform-context', () => ({
  usePlatformContext: vi.fn(),
}))

// --- Tests ---------------------------------------------------------------

describe('useResourceCollection', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns collectionPromise, deleteItem, and createItem', () => {
    const mockHub = createMockHub({
      subscribeSearch: vi.fn(() => Stream.succeed(Either.right([]))),
    })
    vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

    const { result } = renderHook(() => useResourceCollection(Patient))

    expect(result.current).toHaveProperty('collectionPromise')
    expect(result.current).toHaveProperty('deleteItem')
    expect(result.current).toHaveProperty('createItem')
    expect(typeof result.current.deleteItem).toBe('function')
    expect(typeof result.current.createItem).toBe('function')
  })

  it('calls hub.subscribeSearch with the resource domain type', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

    renderHook(() => useResourceCollection(Patient))

    expect(subscribeSearchFn).toHaveBeenCalledWith(Patient, undefined)
  })

  it('passes filters to hub.subscribeSearch', () => {
    const subscribeSearchFn = vi.fn(() => Stream.succeed(Either.right([])))
    const mockHub = createMockHub({ subscribeSearch: subscribeSearchFn })
    vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

    const patientUrl = Schema.decodeSync(Patient.UrlSchema)('http://fhir.test/Patient/123')
    const filters = { patient: Search.Condition.Exactly(patientUrl) }
    renderHook(() => useResourceCollection(Encounter, filters))

    expect(subscribeSearchFn).toHaveBeenCalledWith(Encounter, filters)
  })

  it('deleteItem calls hub.delete with the decoded URL', async () => {
    const deleteFn = vi.fn(() => Effect.void)
    const mockHub = createMockHub({
      delete: deleteFn,
      subscribeSearch: vi.fn(() => Stream.succeed(Either.right([]))),
    })
    vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

    const { result } = renderHook(() => useResourceCollection(Patient))

    await result.current.deleteItem('https://example.com/Patient/123')

    expect(deleteFn).toHaveBeenCalledWith(
      Patient,
      expect.objectContaining({
        pathname: '/Patient/123',
      })
    )
  })

  it('createItem delegates to hub.create with the resource schema and item', () => {
    const patient = { name: [{ family: 'Smith' }], resourceType: 'Patient' }
    const createFn = vi.fn((_klass: unknown, resource: unknown) =>
      Effect.succeed({
        ...(resource as Record<string, unknown>),
        url: 'https://example.com/Patient/456',
      })
    )
    const mockHub = createMockHub({
      create: createFn,
      subscribeSearch: vi.fn(() => Stream.succeed(Either.right([]))),
    })
    vi.mocked(usePlatformContext).mockReturnValue(createMockPlatformContext({ hub: mockHub }))

    const { result } = renderHook(() => useResourceCollection(Patient))

    result.current.createItem(patient as never)

    expect(createFn).toHaveBeenCalledWith(Patient, patient)
  })
})
