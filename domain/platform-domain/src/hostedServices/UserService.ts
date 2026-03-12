import {
  Context,
  Effect,
  Fiber,
  PubSub,
  Schema,
  Stream,
  type Either,
  type Scope,
  type Take,
} from 'effect'

import {
  BadDataError,
  NotFoundError,
  type AuthError,
  type UnhandledError,
} from '@assessmentis/ontology'
import {
  pubsubAsPerpetualStream,
  StreamEither,
  takeOneFromPubSubOrDie,
} from '@assessmentis/util'

import { User } from '../models/User'
import type { UserId } from '../models/UserId'
import { AuthDataService, DocumentStore } from '../tagClasses'

const decodeUser = (data: unknown) =>
  Schema.decodeUnknown(User)(data).pipe(
    Effect.mapError(
      (cause) =>
        new BadDataError({
          message: "The user model couldn't be parsed",
          cause,
        })
    )
  )

/**
 * Creates a sliding `PubSub` (capacity 1, replay 1) for broadcasting the
 * resolved {@link User} profile.
 */
export const createUserPubSub = PubSub.sliding<
  Take.Take<
    Either.Either<
      User,
      | AuthError
      | NotFoundError<'User', { userId: UserId }>
      | BadDataError
      | UnhandledError
    >,
    never
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
export class UserService extends Context.Tag('UserService')<
  UserService,
  {
    /** One-shot read of the current user profile. */
    user: Effect.Effect<
      User,
      | AuthError
      | NotFoundError<'User', { userId: UserId }>
      | BadDataError
      | UnhandledError,
      Scope.Scope
    >
    /** Stream of user profile updates, switching on auth identity changes. */
    userStream: Stream.Stream<
      Either.Either<
        User,
        | AuthError
        | NotFoundError<'User', { userId: UserId }>
        | BadDataError
        | UnhandledError
      >,
      never,
      Scope.Scope
    >
    /** Shuts down the PubSub and joins the daemon fiber. */
    shutdown: Effect.Effect<void, never, never>
  }
>() {}

/**
 * Boots the {@link UserService} by wiring the auth data stream to a
 * {@link DocumentStore} user-document watch. Returns the fully wired service.
 *
 * @param userPubSub - PubSub for broadcasting resolved user profiles
 */
export const startUserService = (
  userPubSub: PubSub.PubSub<
    Take.Take<
      Either.Either<
        User,
        | AuthError
        | NotFoundError<'User', { userId: UserId }>
        | BadDataError
        | UnhandledError
      >,
      never
    >
  >
) =>
  Effect.gen(function* () {
    const { authDataStream } = yield* AuthDataService
    const documentStore = yield* DocumentStore

    const userStream = authDataStream.pipe(
      StreamEither.flatMap(
        (authData) =>
          documentStore.subscribeTo('users', authData.userId).pipe(
            StreamEither.mapLeft((err) =>
              err instanceof NotFoundError
                ? new NotFoundError<'User', { userId: UserId }>({
                    resourceType: 'User',
                    params: { userId: authData.userId },
                  })
                : err
            ),
            StreamEither.mapEffect((u) => decodeUser(u))
          ),
        { switch: true }
      )
    )

    const userPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSubScoped(userPubSub)(userStream)
    )

    const shutdown = Effect.gen(function* () {
      yield* userPubSub.shutdown

      yield* Fiber.joinAll([userPubSubFiber])
    })

    const service: typeof UserService.Service = {
      userStream: pubsubAsPerpetualStream(userPubSub),
      user: takeOneFromPubSubOrDie(userPubSub),
      shutdown,
    }
    return service
  })
