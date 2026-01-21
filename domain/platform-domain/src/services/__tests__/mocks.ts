import { vi, type Mock } from 'vitest'
import { Effect, Layer, Stream, Context } from 'effect'
import { DocumentStore, type DocumentData } from '../../tagClasses'
import { NotFoundError } from '@assessmentis/ontology'
import type { Org } from '../../models/Org'

/**
 * Default org literal for testing
 */
export const defaultOrg = (): Org => ({
  slug: 'test-org' as any, // Will be branded in tests
  frontendConfig: {
    fhirServer: {
      _tag: 'not_implemented' as const,
    },
    videoCallClient: {
      _tag: 'not_implemented' as const,
    },
  },
})

/**
 * Helper implementations for DocumentStore.get mock
 */
export const getImplementations = {
  /**
   * Returns NotFoundError for all paths
   */
  notFound: () => (...path: readonly string[]) =>
    Effect.fail(
      new NotFoundError({
        resourceType: path[0],
        params: { path: path.join('/') },
      })
    ),

  /**
   * Returns specific data for matching paths, NotFoundError otherwise
   */
  withData: (dataMap: Map<string, DocumentData>) => (...path: readonly string[]) => {
    const key = path.join('/')
    const data = dataMap.get(key)
    
    if (data !== undefined) {
      return Effect.succeed(data)
    }
    
    return Effect.fail(
      new NotFoundError({
        resourceType: path[0],
        params: { path: path.join('/') },
      })
    )
  },

  /**
   * Returns data from a custom function, useful for complex logic
   */
  custom: (fn: (...path: readonly string[]) => DocumentData | undefined) => 
    (...path: readonly string[]) => {
      const data = fn(...path)
      
      if (data !== undefined) {
        return Effect.succeed(data)
      }
      
      return Effect.fail(
        new NotFoundError({
          resourceType: path[0],
          params: { path: path.join('/') },
        })
      )
    },
}

/**
 * Create a mock DocumentStore for testing using vitest mocks
 * 
 * @param getImpl - Implementation for the get method (use getImplementations helpers)
 * @returns Layer and vitest mock for DocumentStore
 */
export function createMockDocumentStore(
  getImpl?: (...path: readonly string[]) => Effect.Effect<DocumentData, NotFoundError, never>
): {
  layer: Layer.Layer<DocumentStore, never, never>
  getMock: Mock
} {
  const getMock = vi.fn(getImpl ?? getImplementations.notFound()) as Mock
  
  const get = ((...path: readonly string[]) => {
    return getMock(...path)
  }) as Context.Tag.Service<typeof DocumentStore>['get']

  const mockLayer = Layer.succeed(DocumentStore, {
    get,
    subscribeTo: () => Stream.never,
  })

  return {
    layer: mockLayer,
    getMock,
  }
}
