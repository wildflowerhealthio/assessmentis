import { vi } from 'vitest'
import type { Context } from 'effect'
import { Effect, Stream } from 'effect'
import type { DocumentStore, DocumentData } from '../../tagClasses'
import { NotFoundError } from '@assessmentis/ontology'
import type { Org } from '../../models/Org'
import { OrgSlug } from '../../models/IdTypes'

type DocumentStoreService = Context.Tag.Service<typeof DocumentStore>

/**
 * Default org literal for testing
 */
export const defaultOrg = (): Org => ({
  slug: OrgSlug.make('test-org'),
  emoji: '🏢',
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
      (...path: readonly string[]) =>
        Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            params: { path: path },
          })
        ),

    /**
     * Returns the provided data for all paths
     */
    returning:
      (data: DocumentData) =>
      (..._path: readonly string[]) =>
        Effect.succeed(data),

    /**
     * Returns data from a custom function, useful for complex logic
     */
    withCallback:
      (fn: (...path: readonly string[]) => DocumentData | undefined) =>
      (...path: readonly string[]) => {
        const data = fn(...path)

        if (data !== undefined) {
          return Effect.succeed(data)
        }

        return Effect.fail(
          new NotFoundError({
            resourceType: 'Document',
            params: { path: path },
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
      (..._path: readonly string[]) =>
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
