import { Context, type Effect, type Either, type Stream } from 'effect'

import type { NotFoundError, UnhandledError } from '@assessmentis/ontology'

export interface DocumentData {
  [field: string]: unknown
}

export type DocumentPath = ReadonlyArray<string> & {
  0: string
  1: string
  length: 2 | 4 | 6
}

export class DocumentStore extends Context.Tag('DocumentStore')<
  DocumentStore,
  {
    get(
      ...path: DocumentPath
    ): Effect.Effect<
      DocumentData,
      | NotFoundError<'Document', { path: ReadonlyArray<string> }>
      | UnhandledError,
      never
    >

    subscribeTo(
      ...path: DocumentPath
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
      ...path: DocumentPath
    ): Effect.Effect<void, UnhandledError, never>

    /**
     * Update a document at the given path with the given data.
     * Only the fields specified in data will be updated; other fields remain unchanged.
     * If the document doesn't exist, it will be created.
     */
    update(
      data: Partial<DocumentData>,
      ...path: DocumentPath
    ): Effect.Effect<void, UnhandledError, never>
  }
>() {}
