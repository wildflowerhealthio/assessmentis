import {
  Context,
  Effect,
  Either,
  Option,
  pipe,
  PubSub,
  Stream,
  type Scope,
  type Take,
} from 'effect'

import { UnhandledError, type AuthError } from '@assessmentis/ontology'
import type { UserId } from '@assessmentis/platform-domain'

export interface AuthData {
  userId: UserId
  authToken: string
}

export const createAuthDataPubSub = PubSub.sliding<
  Take.Take<Either.Either<AuthData, AuthError>>
>({
  capacity: 1,
  replay: 1,
})

export class AuthDataService extends Context.Tag('AuthDataService')<
  AuthDataService,
  {
    authDataStream: Stream.Stream<
      Either.Either<AuthData, AuthError>,
      never,
      Scope.Scope
    >
    authData: Effect.Effect<AuthData, AuthError, never>
    shutdown: Effect.Effect<void, never, never>
  }
>() {
  static tryGetAuthData(): Effect.Effect<
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
          onSome: Effect.succeed,
          onNone: () =>
            Effect.fail(
              new UnhandledError({ message: 'Auth Data Stream is closed?' })
            ),
        })
      ),
      Effect.flatMap(
        Either.match({
          onRight: Effect.succeed,
          onLeft: Effect.fail,
        })
      )
    )
  }
}
