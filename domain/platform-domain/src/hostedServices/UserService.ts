import {
  pubsubAsPerpetualStream,
  takeOneFromPubSubOrDie,
} from '@assessmentis/util'
import {
  Context,
  Effect,
  Either,
  Fiber,
  pipe,
  PubSub,
  Schema,
  Scope,
  Stream,
  Take,
} from 'effect'
import {
  AuthError,
  NotFoundError,
  BadDataError,
  UnhandledError,
} from '@assessmentis/ontology'
import { User } from '../models/User'
import { AuthDataService, DocumentStore } from '../tagClasses'
import { UserId } from '../models/UserId'

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

    const userStream: Stream.Stream<
      Either.Either<
        User,
        | AuthError
        | NotFoundError<'User', { userId: UserId }>
        | BadDataError
        | UnhandledError
      >,
      never,
      Scope.Scope
    > = authDataStream.pipe(
      Stream.flatMap(
        (
          e
        ): Stream.Stream<
          Either.Either<
            User,
            | AuthError
            | NotFoundError<'User', { userId: UserId }>
            | BadDataError
            | UnhandledError
          >,
          never,
          never
        > =>
          Either.match(e, {
            onLeft: (authError) =>
              Stream.succeed(
                Either.left<
                  | AuthError
                  | NotFoundError<'User', { userId: UserId }>
                  | BadDataError
                >(authError)
              ),
            onRight: (authData) =>
              documentStore.subscribeTo('users', authData.userId).pipe(
                Stream.map(
                  Either.mapLeft((err) =>
                    err instanceof NotFoundError
                      ? new NotFoundError<'User', { userId: UserId }>({
                          resourceType: 'User',
                          params: { userId: authData.userId },
                        })
                      : err
                  )
                ),
                Stream.mapEffect((e) =>
                  Either.match(e, {
                    onRight(
                      u
                    ): Effect.Effect<
                      Either.Either<
                        User,
                        | AuthError
                        | NotFoundError<'User', { userId: UserId }>
                        | BadDataError
                      >,
                      never
                    > {
                      return pipe(
                        decodeUser(u),
                        Effect.mapError((err) => err),
                        Effect.either
                      )
                    },
                    onLeft(
                      err
                    ): Effect.Effect<
                      Either.Either<
                        User,
                        | AuthError
                        | NotFoundError<'User', { userId: UserId }>
                        | BadDataError
                        | UnhandledError
                      >,
                      never
                    > {
                      return Effect.succeed(
                        Either.left<
                          | AuthError
                          | NotFoundError<'User', { userId: UserId }>
                          | BadDataError
                          | UnhandledError
                        >(err)
                      )
                    },
                  })
                )
              ),
          }),
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
