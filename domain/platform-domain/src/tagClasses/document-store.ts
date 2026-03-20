import { Context } from 'effect'
import type { Effect, Either, Stream } from 'effect'

import type { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { isDevelopment } from '@assessmentis/util'

/** A plain key-value record representing a single document's fields. */
type DocumentData = Record<string, unknown>

/**
 * A Firestore-style document path: an even-length tuple of alternating
 * collection and document ID segments
 *
 * @example `['orgs', 'acme']` or `['orgs', 'acme', 'users', 'uid123']`).
 */
type DocumentPath = readonly string[] & {
  0: string
  1: string
  length: 2 | 4 | 6
}
/**
 * Whether to throw on invalid document data. Defaults to `isDevelopment()`
 * so that data integrity issues are surfaced early in development builds.
 */
let _strictValidation = isDevelopment()

/**
 * Enable strict validation mode for {@link ensureIsDocumentData}.
 * Call this once at app startup in development environments.
 */
function setStrictDocumentValidation(enabled: boolean): void {
  _strictValidation = enabled
}

/**
 * Validates and coerces an unknown value into {@link DocumentData}.
 *
 * In strict mode (see {@link setStrictDocumentValidation}), throws
 * descriptive errors if the value is not a valid document data object
 * (i.e. a non-null, non-array plain object).
 *
 * Otherwise, silently strips non-record values by returning an empty object.
 *
 * @throws {@link TypeError} In strict mode, if `x` is not a plain object.
 */
function describeNonObjectType(x: unknown): string {
  if (x === null) {
    return 'null'
  }
  if (Array.isArray(x)) {
    return 'an array'
  }
  return typeof x
}

function ensureIsDocumentData(x: unknown): DocumentData {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) {
    if (_strictValidation) {
      throw new TypeError(
        `Expected DocumentData (a plain object), but received ${describeNonObjectType(x)}`
      )
    }
    return {}
  }

  // Structurally, any non-null non-array object satisfies { [field: string]: unknown }
  const record: DocumentData = Object.create(null)
  for (const [key, value] of Object.entries(x)) {
    record[key] = value
  }
  return record
}

/**
 * Abstract document read/write service backed by a hierarchical document store.
 *
 * @remarks
 * Infrastructure provides the concrete implementation. Domain code depends on
 * this tag to stay pure and testable.
 */
class DocumentStore extends Context.Tag('DocumentStore')<
  DocumentStore,
  {
    /** Read a single document, failing with `NotFoundError` if it does not exist. */
    get(
      path: DocumentPath
    ): Effect.Effect<
      DocumentData,
      NotFoundError<'Document', { path: readonly string[] }> | UnhandledError
    >

    /** Subscribe to real-time updates for a document at the given path. */
    subscribeTo(
      path: DocumentPath
    ): Stream.Stream<
      Either.Either<
        DocumentData,
        NotFoundError<'Document', { path: readonly string[] }> | UnhandledError
      >,
      never
    >

    /**
     * Set a document at the given path, creating it if it doesn't exist
     * or completely overwriting it if it does.
     */
    set(data: DocumentData, path: DocumentPath): Effect.Effect<void, UnhandledError>

    /**
     * Update a document at the given path with the given data.
     * Only the fields specified in data will be updated; other fields remain unchanged.
     * If the document doesn't exist, it will be created.
     */
    update(data: Partial<DocumentData>, path: DocumentPath): Effect.Effect<void, UnhandledError>
  }
>() {}

export {
  type DocumentData,
  type DocumentPath,
  DocumentStore,
  ensureIsDocumentData,
  setStrictDocumentValidation,
}
