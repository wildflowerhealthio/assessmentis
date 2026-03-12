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

export class UserService extends Context.Tag('UserService')<
  UserService,
  {
    user: Effect.Effect<
      User,
      | AuthError
      | NotFoundError<'User', { userId: UserId }>
      | BadDataError
      | UnhandledError,
      Scope.Scope
    >
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
    shutdown: Effect.Effect<void, never, never>
  }
>() {}

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
