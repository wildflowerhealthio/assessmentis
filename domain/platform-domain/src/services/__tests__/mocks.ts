import { Effect, Stream } from 'effect'
import type { Context } from 'effect'
import { vi } from 'vitest'

import { NotFoundError } from '@assessmentis/ontology'

import { OrgSlug } from '../../models/id-types'
import { Org } from '../../models/org'
import type { DocumentData, DocumentPath, DocumentStore } from '../../tagClasses'

type DocumentStoreService = Context.Tag.Service<typeof DocumentStore>

/**
 * Default org instance for testing.
 */
const defaultOrg = (): Org =>
  Org.make({
    emoji: '🏢',
    slug: OrgSlug.make('test-org'),
  })

/**
 * Mock implementations for DocumentStore methods
 */
const mockDocumentStoreImplementations: {
  [k in keyof DocumentStoreService]: Record<
    string,
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: readonly any[]) => DocumentStoreService[k]
  >
} = {
  get: {
    /**
     * Returns NotFoundError for all paths
     */
    notFound: () => (path: DocumentPath) =>
      Effect.fail(
        new NotFoundError({
          resourceType: 'Document',
          params: { path },
        })
      ),

    /**
     * Returns the provided data for all paths
     */
    returning: (data: DocumentData) => (_path: DocumentPath) => Effect.succeed(data),

    /**
     * Returns data from a custom function, useful for complex logic
     */
    withCallback:
      (fn: (path: DocumentPath) => DocumentData | undefined) => (path: DocumentPath) => {
        const data = fn(path)

        if (data !== undefined) {
          return Effect.succeed(data)
        }

        return Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            params: { path },
          })
        )
      },
  },

  set: {
    /**
     * No-op set that always succeeds
     */
    noop: () => (_data: DocumentData, _path: DocumentPath) => Effect.void,
  },

  subscribeTo: {
    /**
     * Returns an empty stream that never emits
     */
    emptyStream: () => (_path: DocumentPath) => Stream.never,
  },

  update: {
    /**
     * No-op update that always succeeds
     */
    noop: () => (_data: Partial<DocumentData>, _path: DocumentPath) => Effect.void,
  },
}

/**
 * Create a mock DocumentStore for testing using vitest mocks
 *
 * @param impl - Partial implementation to override defaults
 * @returns DocumentStore service with vitest mocks
 */
const mockDocumentStore = (impl: Partial<DocumentStoreService> = {}): DocumentStoreService => ({
  get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
  set: vi.fn(mockDocumentStoreImplementations.set.noop()),
  subscribeTo: vi.fn(mockDocumentStoreImplementations.subscribeTo.emptyStream()),
  update: vi.fn(mockDocumentStoreImplementations.update.noop()),
  ...impl,
})

export { defaultOrg, mockDocumentStore, mockDocumentStoreImplementations }
