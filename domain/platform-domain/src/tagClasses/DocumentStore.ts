import { Context, Effect, Either, Stream } from 'effect'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

export interface DocumentData {
  [field: string]: unknown
}

export class DocumentStore extends Context.Tag('DocumentStore')<
  DocumentStore,
  {
    get(
      ...path: ReadonlyArray<string> & {
        0: string
        1: string
        length: 2 | 4 | 6
      }
    ): Effect.Effect<DocumentData, NotFoundError | UnhandledError, never>

    subscribeTo(
      ...path: ReadonlyArray<string> & {
        0: string
        1: string
        length: 2 | 4 | 6
      }
    ): Stream.Stream<Either.Either<DocumentData, NotFoundError>, never, never>
  }
>() {}
