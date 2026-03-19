import { Context, Effect, Fiber, PubSub, Schema, Stream } from 'effect'
import type { Either, Scope, Take } from 'effect'

import { DataIntegrityError, NotFoundError } from '@assessmentis/ontology'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { StreamEither, pubsubAsPerpetualStream, takeOneFromPubSubOrDie } from '@assessmentis/util'

import { User } from '../models/user'
import type { UserId } from '../models/user-id'
import { AuthDataService, DocumentStore } from '../tagClasses'

const decodeUser = (data: unknown): Effect.Effect<User, DataIntegrityError> =>
  Schema.decodeUnknown(User)(data).pipe(
    Effect.mapError(
      (cause) =>
        new DataIntegrityError({
          cause,
          message: "The user model couldn't be parsed",
        })
    )
  )
/**
 * Creates a sliding `PubSub` (capacity 1, replay 1) for broadcasting the
 * resolved {@link User} profile.
 */
const createUserPubSub = PubSub.sliding<
  Take.Take<
    Either.Either<
      User,
      AuthError | NotFoundError<'User', { userId: UserId }> | DataIntegrityError | UnhandledError
    >
  >
>({
  capacity: 1,
  replay: 1,
})

/**
 * Client-side reactive service for the authenticated user's profile.
 *
 * @remarks
 * Subscribes to the {@link AuthDataService} stream and resolves the
 * authenticated user's document from {@link DocumentStore}. When the auth
 * state changes (e.g. token rotation or sign-out), the user stream
 * automatically switches to the new identity's document.
 */
class UserService extends Context.Tag('UserService')<
  UserService,
  {
    /** One-shot read of the current user profile. */
    user: Effect.Effect<
      User,
      AuthError | NotFoundError<'User', { userId: UserId }> | DataIntegrityError | UnhandledError,
      Scope.Scope
    >
    /** Stream of user profile updates, switching on auth identity changes. */
    userStream: Stream.Stream<
      Either.Either<
        User,
        AuthError | NotFoundError<'User', { userId: UserId }> | DataIntegrityError | UnhandledError
      >,
      never,
      Scope.Scope
    >
    /** Shuts down the PubSub and joins the daemon fiber. */
    shutdown: Effect.Effect<void, never>
  }
>() {}

/**
 * Boots the {@link UserService} by wiring the auth data stream to a
 * {@link DocumentStore} user-document watch. Returns the fully wired service.
 *
 * @param userPubSub - PubSub for broadcasting resolved user profiles
 */
const startUserService = (
  userPubSub: PubSub.PubSub<
    Take.Take<
      Either.Either<
        User,
        AuthError | NotFoundError<'User', { userId: UserId }> | DataIntegrityError | UnhandledError
      >
    >
  >
): Effect.Effect<
  typeof UserService.Service,
  AuthError | UnhandledError,
  AuthDataService | DocumentStore | Scope.Scope
> =>
  Effect.gen(function* startUserServiceGen() {
    const { authDataStream } = yield* AuthDataService
    const documentStore = yield* DocumentStore

    const userStream = authDataStream.pipe(
      StreamEither.flatMap(
        (authData) =>
          documentStore.subscribeTo(['users', authData.userId]).pipe(
            StreamEither.mapLeft((err) => {
              if (err instanceof NotFoundError) {
                return new NotFoundError<'User', { userId: UserId }>({
                  params: { userId: authData.userId },
                  resourceType: 'User',
                })
              }
              return err
            }),
            StreamEither.mapEffect((u) => decodeUser(u))
          ),
        { switch: true }
      )
    )

    const userPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSubScoped(userPubSub)(userStream)
    )

    const shutdown = Effect.gen(function* shutdown() {
      yield* userPubSub.shutdown

      yield* Fiber.joinAll([userPubSubFiber])
    })

    const service: typeof UserService.Service = {
      shutdown,
      user: takeOneFromPubSubOrDie(userPubSub),
      userStream: pubsubAsPerpetualStream(userPubSub),
    }
    return service
  })

export { createUserPubSub, UserService, startUserService }
