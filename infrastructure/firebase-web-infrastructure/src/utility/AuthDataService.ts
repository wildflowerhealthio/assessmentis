import {
  Effect,
  Fiber,
  Option,
  Stream,
  type Either,
  type PubSub,
  type Take,
} from 'effect'

import { AuthError } from '@assessmentis/ontology'
import {
  UserId,
  type AuthData,
  type AuthDataService,
} from '@assessmentis/platform-domain'
import {
  pubsubAsPerpetualStream,
  takeOneFromPubSubOrDie,
  unsubscribableCallbackAsStream,
} from '@assessmentis/util'

import { onIdTokenChanged } from 'firebase/auth'

import { FirebaseWeb } from '../tagClasses'

const AuthDataStream = Effect.gen(function* () {
  const { auth } = yield* FirebaseWeb

  yield* Effect.promise<void>(() => auth.authStateReady())

  return unsubscribableCallbackAsStream<
    Either.Either<AuthData, AuthError>,
    never
  >((onData) =>
    onIdTokenChanged(auth, (maybeUser) =>
      Option.fromNullable(maybeUser).pipe(
        Option.match({
          onSome: (user): Effect.Effect<AuthData, AuthError> =>
            Effect.promise(async () => ({
              userId: UserId.make(user.uid),
              authToken: await user.getIdToken(),
            })),
          onNone: (): Effect.Effect<AuthData, AuthError> =>
            Effect.fail(AuthError.Unauthenticated),
        }),
        Effect.either,
        onData
      )
    )
  )
}).pipe(Stream.unwrap)

export const startAuthDataService = (
  authDataPubSub: PubSub.PubSub<Take.Take<Either.Either<AuthData, AuthError>>>
): Effect.Effect<typeof AuthDataService.Service, never, FirebaseWeb> =>
  Effect.gen(function* () {
    // const s = Stream.runIntoPubSub(AuthDataStream, authDataPubSub)
    // yield* s
    const authDataPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(AuthDataStream, authDataPubSub)
    )

    const shutdown = Effect.gen(function* () {
      yield* authDataPubSub.shutdown
      yield* Fiber.join(authDataPubSubFiber)
    })

    const service: typeof AuthDataService.Service = {
      authDataStream: pubsubAsPerpetualStream(authDataPubSub),
      authData: takeOneFromPubSubOrDie(authDataPubSub),
      shutdown,
    }

    return service
  })
