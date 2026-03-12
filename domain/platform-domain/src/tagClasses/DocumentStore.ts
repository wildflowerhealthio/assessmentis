import { Context, type Effect, type Either, type Stream } from 'effect'

import type { NotFoundError, UnhandledError } from '@assessmentis/ontology'

/** A plain key-value record representing a single document's fields. */
export interface DocumentData {
  [field: string]: unknown
}

/**
 * A Firestore-style document path: an even-length tuple of alternating
 * collection and document ID segments
 *
 * @example `['orgs', 'acme']` or `['orgs', 'acme', 'users', 'uid123']`).
 */
export type DocumentPath = ReadonlyArray<string> & {
  0: string
  1: string
  length: 2 | 4 | 6
}

/**
 * Validates and coerces an unknown value into {@link DocumentData}.
 *
 * In development (`NODE_ENV !== 'production'`), throws descriptive errors
 * if the value is not a valid document data object (i.e. a non-null,
 * non-array plain object).
 *
 * In production, silently strips non-record values by returning an empty
 * object.
 *
 * @throws {@link TypeError} In development, if `x` is not a plain object.
 */
export function ensureIsDocumentData(x: unknown): DocumentData {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) {
    if (process.env['NODE_ENV'] == 'development') {
      throw new TypeError(
        `Expected DocumentData (a plain object), but received ${
          x === null ? 'null' : Array.isArray(x) ? 'an array' : typeof x
        }`
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
 * Abstract document read/write service backed by a Firestore-like store.
 *
 * @remarks
 * Infrastructure provides the concrete implementation (Firebase Web SDK on
 * the client, Firebase Admin SDK on the server). Domain code depends on
 * this tag to stay pure and testable.
 */
export class DocumentStore extends Context.Tag('DocumentStore')<
  DocumentStore,
  {
    /** Read a single document, failing with `NotFoundError` if it does not exist. */
    get(
      ...path: DocumentPath | readonly [DocumentPath]
    ): Effect.Effect<
      DocumentData,
      | NotFoundError<'Document', { path: ReadonlyArray<string> }>
      | UnhandledError,
      never
    >

    /** Subscribe to real-time updates for a document at the given path. */
    subscribeTo(
      ...path: DocumentPath | readonly [DocumentPath]
    ): Stream.Stream<
      Either.Either<
        DocumentData,
        | NotFoundError<'Document', { path: ReadonlyArray<string> }>
        | UnhandledError
      >,
      never,
      never
    >

    /**
     * Set a document at the given path, creating it if it doesn't exist
     * or completely overwriting it if it does.
     */
    set(
      data: DocumentData,
      ...path: DocumentPath | readonly [DocumentPath]
    ): Effect.Effect<void, UnhandledError, never>

    /**
     * Update a document at the given path with the given data.
     * Only the fields specified in data will be updated; other fields remain unchanged.
     * If the document doesn't exist, it will be created.
     */
    update(
      data: Partial<DocumentData>,
      ...path: DocumentPath | readonly [DocumentPath]
    ): Effect.Effect<void, UnhandledError, never>
  }
>() {}
