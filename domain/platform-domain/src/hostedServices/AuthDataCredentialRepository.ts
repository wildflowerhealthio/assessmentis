import {
  Effect,
  Either,
  Readable,
  Stream,
  Subscribable,
  SubscriptionRef,
  type Scope,
} from 'effect'
import { pipeArguments } from 'effect/Pipeable'

import { Loading } from '@assessmentis/ontology'
import { StreamEither } from '@assessmentis/util'

import { AuthDataService, type AuthData } from '../tagClasses/AuthDataService'
import type {
  CredentialError,
  CredentialToken,
  LiveCredential,
  TokenStreamError,
} from '../tagClasses/CredentialRepository'

/**
 * Constructor contract for a credential class backed by AuthData.
 *
 * Must provide a static `fromAuthData` mapping and accept a `SubscriptionRef`
 * in its constructor.
 */
export interface AuthDataCredentialClass<
  Tag extends string,
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
> {
  fromAuthData(authData: AuthData): TCredentialToken
  new (
    stateRef: SubscriptionRef.SubscriptionRef<
      Either.Either<TCredentialToken, CredentialError>
    >
  ): AuthDataLiveCredential<Tag, TCredentialToken>
}

/**
 * A live credential derived from the {@link AuthDataService} stream.
 *
 * Provides `get` and `changes` backed by a {@link SubscriptionRef}.
 * No refresh is needed — when the auth token rotates, the stream naturally
 * produces a new credential.
 *
 * @typeParam Tag - Discriminant tag for the token type
 * @typeParam TCredentialToken - The token value type
 */
export class AuthDataLiveCredential<
  out Tag extends string,
  out TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
> implements LiveCredential<Tag, TCredentialToken, never> {
  readonly [Readable.TypeId]: typeof Readable.TypeId = Readable.TypeId
  readonly [Subscribable.TypeId]: typeof Subscribable.TypeId =
    Subscribable.TypeId
  readonly get: Effect.Effect<TCredentialToken, CredentialError, never>
  readonly changes: SubscriptionRef.SubscriptionRef<
    Either.Either<TCredentialToken, CredentialError>
  >['changes']

  constructor(
    stateRef: SubscriptionRef.SubscriptionRef<
      Either.Either<TCredentialToken, CredentialError>
    >
  ) {
    this.get = Effect.flatMap(SubscriptionRef.get(stateRef), (either) =>
      Either.match(either, {
        onLeft: (error) => Effect.fail(error),
        onRight: (value) => Effect.succeed(value),
      })
    )

    this.changes = stateRef.changes
  }

  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  }

  readonly refresh: Effect.Effect<void, TokenStreamError, Scope.Scope> =
    Effect.void
}

/**
 * Creates a singleton {@link LiveCredential} backed by the {@link AuthDataService} stream.
 *
 * Each AuthData emission is mapped to a credential token via the class's
 * static `fromAuthData`. The resulting credential requires no refresh —
 * it updates automatically when the auth token rotates.
 *
 * Requires {@link AuthDataService} and {@link Scope} at construction time.
 */
export const makeAuthDataCredentialRepository = <
  Tag extends string,
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
>(
  CredentialClass: AuthDataCredentialClass<Tag, TCredentialToken>
): Effect.Effect<
  AuthDataLiveCredential<Tag, TCredentialToken>,
  never,
  AuthDataService | Scope.Scope
> =>
  Effect.gen(function* () {
    const { authDataStream } = yield* AuthDataService

    const stateRef = yield* SubscriptionRef.make<
      Either.Either<TCredentialToken, CredentialError>
    >(
      Either.left(
        new Loading({
          entity: { toString: () => CredentialClass.name },
        })
      )
    )

    const tokenStream = authDataStream.pipe(
      StreamEither.map((authData) => CredentialClass.fromAuthData(authData))
    )

    yield* Stream.runForEach(tokenStream, (value) =>
      SubscriptionRef.set(stateRef, value)
    ).pipe(Effect.forkScoped)

    return new CredentialClass(stateRef)
  })
