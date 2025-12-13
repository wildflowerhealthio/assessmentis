import { Context, Data, Effect, Schema } from 'effect'
import { Media, MediaId } from './models/Media'

import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '../errors'
import { WithId } from '../general-purpose'

export class MediaError extends Data.TaggedError('MediaError')<{
  message: string
  cause?: unknown
}> {}

export class MediaNotFound extends Data.TaggedError('MediaNotFound')<{
  mediaId?: MediaId
}> {}

const GetMediaParams = Schema.Struct({})
type GetMediaParams = typeof GetMediaParams.Type

export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  {
    getMedia(
      mediaId: MediaId
    ): Effect.Effect<
      WithId<Media>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    getAllMedia(
      params: GetMediaParams
    ): Effect.Effect<
      WithId<Media>[],
      | NotFoundError
      | NeedsAuthenticationError
      | UnhandledError
      | ExternalAssertionError,
      never
    >

    createMedia(
      media: Media
    ): Effect.Effect<
      WithId<Media>,
      NeedsAuthenticationError | ExternalAssertionError | UnhandledError,
      never
    >

    updateMedia(
      media: WithId<Media>
    ): Effect.Effect<
      WithId<Media>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    deleteMedia(
      mediaId: MediaId
    ): Effect.Effect<
      object,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >
  }
>() {}
