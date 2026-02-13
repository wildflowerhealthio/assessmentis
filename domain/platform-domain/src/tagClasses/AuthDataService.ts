import type { UserId } from '@assessmentis/platform-domain'
import type { AuthError } from '@assessmentis/ontology'
import type { Effect, Either, Scope, Stream, Take } from 'effect'
import { Context, PubSub } from 'effect'

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
>() {}
