import type { UserId } from '@assessmentis/platform-domain'
import {
  CurrentUserId,
  DocumentStore,
  User,
} from '@assessmentis/platform-domain'
import { Context, Effect, Either, Layer, Schema } from 'effect'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

export class LoadedUser extends Context.Tag('LoadedUser')<LoadedUser, User>() {}

const decodeUser = (userId: UserId, data: unknown | undefined) =>
  Effect.gen(function* () {
    if (data == undefined) {
      return yield* Effect.fail(
        new NotFoundError<'User', { userId: UserId }>({
          resourceType: 'User',
          params: { userId },
        }).asUnhandledError()
      )
    }
    return yield* Schema.decodeUnknownEither(User)(data).pipe(
      Either.mapLeft(
        (cause) =>
          new UnhandledError({
            message: `Error decoding user`,
            cause,
          })
      )
    )
  })

export const LiteralLoadedUserLayer = (
  userId: UserId,
  data: undefined | unknown
): Layer.Layer<LoadedUser, UnhandledError, never> =>
  Layer.effect(LoadedUser, decodeUser(userId, data))

export const LoadedUserLayer = Layer.effect(
  LoadedUser,
  Effect.gen(function* () {
    const documentStore = yield* DocumentStore
    const currentUserId = yield* CurrentUserId

    const data = yield* documentStore.get('users', currentUserId.userId)
    const user = yield* Schema.decodeUnknownEither(User)(data).pipe(
      Either.mapLeft(
        (cause) =>
          new UnhandledError({
            message: `Error decoding user`,
            cause,
          })
      )
    )
    return user
  })
)
