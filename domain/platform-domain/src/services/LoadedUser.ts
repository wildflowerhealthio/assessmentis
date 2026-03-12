import { Context, Effect, Either, Layer, Schema } from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import {
  CurrentUserId,
  DocumentStore,
  User,
  type UserId,
} from '@assessmentis/platform-domain'

/**
 * Effect context tag carrying the resolved {@link User} instance for the
 * current request or session.
 *
 * @remarks
 * Used on the server side (Cloud Functions) after auth validation. Domain
 * code depends on this tag to access the authenticated user without passing
 * it as a parameter.
 *
 * @see {@link LoadedUserLayer} for the standard DocumentStore-backed provider
 * @see {@link LiteralLoadedUserLayer} for test/literal construction
 */
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

/**
 * Constructs a {@link LoadedUser} layer from raw data, decoding it with the
 * {@link User} schema. Useful in tests or when the user document is already
 * available.
 */
export const LiteralLoadedUserLayer = (
  userId: UserId,
  data: undefined | unknown
): Layer.Layer<LoadedUser, UnhandledError, never> =>
  Layer.effect(LoadedUser, decodeUser(userId, data))

/**
 * Standard {@link LoadedUser} layer that reads from {@link DocumentStore}
 * using the {@link CurrentUserId}.
 */
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
