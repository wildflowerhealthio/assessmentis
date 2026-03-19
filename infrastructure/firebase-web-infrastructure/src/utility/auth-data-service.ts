import { Effect, Fiber, Option, Stream } from 'effect'
import type { Either, PubSub, Take } from 'effect'

import { AuthError } from '@assessmentis/ontology'
import { UserId } from '@assessmentis/platform-domain'
import type { AuthData, AuthDataService } from '@assessmentis/platform-domain'
import {
  pubsubAsPerpetualStream,
  takeOneFromPubSubOrDie,
  unsubscribableCallbackAsStream,
} from '@assessmentis/util'

import { onIdTokenChanged } from 'firebase/auth'

import { FirebaseWeb } from '../tagClasses'

const AuthDataStream = Effect.gen(function* AuthDataStream() {
  const { auth } = yield* FirebaseWeb

  yield* Effect.promise<void>(async () => auth.authStateReady())

  return unsubscribableCallbackAsStream<Either.Either<AuthData, AuthError>, never>((onData) =>
    onIdTokenChanged(auth, (maybeUser) => {
      Option.fromNullable(maybeUser).pipe(
        Option.match({
          onNone: (): Effect.Effect<AuthData, AuthError> => Effect.fail(AuthError.Unauthenticated),
          onSome: (user): Effect.Effect<AuthData, AuthError> =>
            Effect.promise(async () => ({
              userId: UserId.make(user.uid),
              authToken: await user.getIdToken(),
            })),
        }),
        Effect.either,
        onData
      )
    })
  )
}).pipe(Stream.unwrap)

export const startAuthDataService = (
  authDataPubSub: PubSub.PubSub<Take.Take<Either.Either<AuthData, AuthError>>>
): Effect.Effect<typeof AuthDataService.Service, never, FirebaseWeb> =>
  Effect.gen(function* () {
    // Const s = Stream.runIntoPubSub(AuthDataStream, authDataPubSub)
    // Yield* s
    const authDataPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(AuthDataStream, authDataPubSub)
    )

    const shutdown = Effect.gen(function* shutdown() {
      yield* authDataPubSub.shutdown
      yield* Fiber.join(authDataPubSubFiber)
    })

    const service: typeof AuthDataService.Service = {
      authData: takeOneFromPubSubOrDie(authDataPubSub),
      authDataStream: pubsubAsPerpetualStream(authDataPubSub),
      shutdown,
    }

    return service
  })
