import { Effect, Stream } from 'effect'
import type { Context } from 'effect'
import { vi } from 'vitest'

import { NotFoundError } from '@assessmentis/ontology'

import { OrgSlug } from '../../models/id-types'
import type { Org } from '../../models/org'
import type { DocumentData, DocumentPath, DocumentStore } from '../../tagClasses'

type DocumentStoreService = Context.Tag.Service<typeof DocumentStore>

/**
 * Default org literal for testing
 */
export const defaultOrg = (): Org => ({
  emoji: '🏢',
  originServerConfigs: {},
  origins: {},
  slug: OrgSlug.make('test-org'),
})

/**
 * Mock implementations for DocumentStore methods
 */
export const mockDocumentStoreImplementations: {
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
    notFound:
      () =>
      (...path: DocumentPath | readonly [DocumentPath]) =>
        Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            // oxlint-disable-next-line eslint/no-ternary
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
      (fn: (...path: DocumentPath | readonly [DocumentPath]) => DocumentData | undefined) =>
      (...path: DocumentPath | readonly [DocumentPath]) => {
        let resolvedPath: DocumentPath | readonly [DocumentPath]
        if (path.length === 1) {
          resolvedPath = path[0]
        } else {
          resolvedPath = path
        }
        const data = fn(resolvedPath)

        if (data !== undefined) {
          return Effect.succeed(data)
        }

        return Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            // oxlint-disable-next-line eslint/no-ternary
            params: { path: path.length === 1 ? path[0] : path },
          })
        )
      },
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

  subscribeTo: {
    /**
     * Returns an empty stream that never emits
     */
    emptyStream:
      () =>
      (..._path: DocumentPath | readonly [DocumentPath]) =>
        Stream.never,
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
  set: vi.fn(mockDocumentStoreImplementations.set.noop()),
  subscribeTo: vi.fn(mockDocumentStoreImplementations.subscribeTo.emptyStream()),
  update: vi.fn(mockDocumentStoreImplementations.update.noop()),
  ...impl,
})
