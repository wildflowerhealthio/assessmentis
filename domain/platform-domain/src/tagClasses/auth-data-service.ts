import { Context, Effect, Either, Option, PubSub, Stream, pipe } from 'effect'
import type { Scope, Take } from 'effect'

import { UnhandledError } from '@assessmentis/ontology'
import type { AuthError } from '@assessmentis/ontology'
import type { UserId } from '@assessmentis/platform-domain'

/** The authenticated user's ID and raw auth token. */
export interface AuthData {
  userId: UserId
  authToken: string
}

/**
 * Creates a sliding `PubSub` (capacity 1, replay 1) for broadcasting
 * auth-state changes to all subscribers.
 */
export const createAuthDataPubSub = PubSub.sliding<Take.Take<Either.Either<AuthData, AuthError>>>({
  capacity: 1,
  replay: 1,
})

/**
 * Reactive authentication state service.
 *
 * @remarks
 * Provides a stream of {@link AuthData} updates (or {@link AuthError} on
 * failure) and a one-shot `authData` effect for the current value.
 * Initialized by `PlatformContextProvider` on the client side.
 */
export class AuthDataService extends Context.Tag('AuthDataService')<
  AuthDataService,
  {
    /** Stream of auth state changes. Each emission is either valid credentials or an auth error. */
    authDataStream: Stream.Stream<Either.Either<AuthData, AuthError>, never, Scope.Scope>
    /** One-shot read of the current auth credentials. */
    authData: Effect.Effect<AuthData, AuthError>
    /** Shuts down the auth data stream and releases resources. */
    shutdown: Effect.Effect<void, never>
  }
>() {
  /**
   * Takes the first value from the auth data stream, failing with
   * {@link UnhandledError} if the stream is already closed.
   */
  static getAuthData(): Effect.Effect<
    AuthData,
    AuthError | UnhandledError,
    Scope.Scope | AuthDataService
  > {
    return pipe(
      AuthDataService,
      Effect.map(({ authDataStream }) => authDataStream),
      Effect.flatMap(Stream.runHead),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new UnhandledError({ message: 'Auth Data Stream is closed?' })),
          onSome: Effect.succeed,
        })
      ),
      Effect.flatMap(
        Either.match({
          onLeft: Effect.fail,
          onRight: Effect.succeed,
        })
      )
    )
  }
}
