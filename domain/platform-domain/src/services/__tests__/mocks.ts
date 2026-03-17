import { vi } from 'vitest'
import { Effect, Stream } from 'effect'
import type { Context } from 'effect'

import { NotFoundError } from '@assessmentis/ontology'

import { OrgSlug } from '../../models/IdTypes'
import type { Org } from '../../models/Org'
import type {
  DocumentData,
  DocumentPath,
  DocumentStore,
} from '../../tagClasses'

type DocumentStoreService = Context.Tag.Service<typeof DocumentStore>

/**
 * Default org literal for testing
 */
export const defaultOrg = (): Org => ({
  slug: OrgSlug.make('test-org'),
  emoji: '🏢',
  origins: {},
  originServerConfigs: {},
})

/**
 * Mock implementations for DocumentStore methods
 */
export const mockDocumentStoreImplementations: {
  [k in keyof DocumentStoreService]: Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: readonly any[]) => DocumentStoreService[k]
  >
} = {
  get: {
    /**
     * Returns NotFoundError for all paths
     */
    notFound:
      () =>
      (...path: DocumentPath | readonly [DocumentPath]) =>
        Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            params: { path: path.length === 1 ? path[0] : path },
          })
        ),

    /**
     * Returns the provided data for all paths
     */
    returning:
      (data: DocumentData) =>
      (..._path: DocumentPath | readonly [DocumentPath]) =>
        Effect.succeed(data),

    /**
     * Returns data from a custom function, useful for complex logic
     */
    withCallback:
      (
        fn: (
          ...path: DocumentPath | readonly [DocumentPath]
        ) => DocumentData | undefined
      ) =>
      (...path: DocumentPath | readonly [DocumentPath]) => {
        const data = fn(path.length === 1 ? path[0] : path)

        if (data !== undefined) {
          return Effect.succeed(data)
        }

        return Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            params: { path: path.length === 1 ? path[0] : path },
          })
        )
      },
  },

  subscribeTo: {
    /**
     * Returns an empty stream that never emits
     */
    emptyStream:
      () =>
      (..._path: DocumentPath | readonly [DocumentPath]) =>
        Stream.never,
  },

  set: {
    /**
     * No-op set that always succeeds
     */
    noop:
      () =>
      (..._args: readonly unknown[]) =>
        Effect.void,
  },

  update: {
    /**
     * No-op update that always succeeds
     */
    noop:
      () =>
      (..._args: readonly unknown[]) =>
        Effect.void,
  },
}

/**
 * Create a mock DocumentStore for testing using vitest mocks
 *
 * @param impl - Partial implementation to override defaults
 * @returns DocumentStore service with vitest mocks
 */
export const mockDocumentStore = (
  impl: Partial<DocumentStoreService> = {}
): DocumentStoreService => ({
  get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
  subscribeTo: vi.fn(
    mockDocumentStoreImplementations.subscribeTo.emptyStream()
  ),
  set: vi.fn(mockDocumentStoreImplementations.set.noop()),
  update: vi.fn(mockDocumentStoreImplementations.update.noop()),
  ...impl,
})
