import { vi } from 'vitest'
import { Effect, Stream, Context } from 'effect'
import { DocumentStore, type DocumentData } from '../../tagClasses'
import { NotFoundError } from '@assessmentis/ontology'
import type { Org } from '../../models/Org'
import { OrgSlug } from '../../models/IdTypes'

type DocumentStoreService = Context.Tag.Service<typeof DocumentStore>

/**
 * Default org literal for testing
 */
export const defaultOrg = (): Org => ({
  slug: OrgSlug.make('test-org'),
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
 * Mock implementations for DocumentStore methods
 */
export const mockDocumentStoreImplementations = {
  get: {
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
     * Returns the provided data for all paths
     */
    returning: (data: DocumentData) => (..._path: readonly string[]) =>
      Effect.succeed(data),

    /**
     * Returns data from a custom function, useful for complex logic
     */
    withCallback: (fn: (...path: readonly string[]) => DocumentData | undefined) => 
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
  },

  subscribeTo: {
    /**
     * Returns an empty stream that never emits
     */
    emptyStream: () => (..._path: readonly string[]) => Stream.never,
  },
}

/**
 * Create a mock DocumentStore for testing using vitest mocks
 * 
 * @param impl - Partial implementation to override defaults
 * @returns DocumentStore service with vitest mocks
 */
export const mockDocumentStore = (impl: Partial<DocumentStoreService> = {}): DocumentStoreService => ({
  get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
  subscribeTo: vi.fn(mockDocumentStoreImplementations.subscribeTo.emptyStream()),
  ...impl,
})
