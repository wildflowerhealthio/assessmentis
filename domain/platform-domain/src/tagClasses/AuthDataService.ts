import {
  Context,
  PubSub,
  type Effect,
  type Either,
  type Scope,
  type Stream,
  type Take,
} from 'effect'

import type { AuthError } from '@assessmentis/ontology'
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
>() {}
