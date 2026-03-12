import type {
  DateTime,
  Duration,
  Effect,
  Either,
  Option,
  Pipeable,
  Readable,
  Schema,
  Scope,
  Stream,
  Subscribable,
} from 'effect'

import type {
  AuthError,
  BadDataError,
  Loading,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

/**
 * Errors that can occur in the ongoing token stream — during the DocumentStore
 * watch subscription or a refresh attempt.
 */
export type TokenStreamError =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NotFoundError<string, any> | BadDataError | AuthError | UnhandledError

/**
 * All possible error states when reading a credential — {@link TokenStreamError}
 * plus the initial {@link Loading} state before the first token arrives.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CredentialError = TokenStreamError | Loading<any>

/**
 * A decodable token value with an expiry and the ability to produce an
 * invalidated copy of itself.
 *
 * @typeParam Self - The concrete token type (F-bounded for {@link asInvalidated})
 * @typeParam Tag - Discriminant tag for the token type
 */
export interface CredentialToken<
  out Self extends CredentialToken<Self, Tag>,
  out Tag extends string,
> {
  readonly _tag: Tag
  readonly expiresAt: DateTime.Utc | undefined
  asInvalidated(): Self
}

/**
 * A credential token that carries a refresh token and can produce a copy
 * with updated access credentials.
 *
 * Opt-in extension of {@link CredentialToken} for tokens that support
 * server-side refresh (e.g., OAuth tokens with refresh grants).
 *
 * @typeParam Self - The concrete token type (F-bounded)
 * @typeParam Tag - Discriminant tag for the token type
 */
export interface RefreshableCredentialToken<
  Self extends RefreshableCredentialToken<Self, Tag>,
  Tag extends string,
> extends CredentialToken<Self, Tag> {
  readonly refreshToken: Option.Option<string>
  withRefreshedAccess(accessToken: string, expiresAt: DateTime.Utc): Self
}

/**
 * A live, observable credential that watches for token updates and supports
 * proactive refresh.
 *
 * - `get` — reads the current token value
 * - `changes` — stream of token updates (including errors)
 * - `refresh` — proactively obtains a new token (e.g., before expiry)
 *
 * @typeParam Tag - Discriminant tag for the token type
 * @typeParam TCredentialToken - The token value type
 * @typeParam TTokenContext - Effect services required by `refresh`, beyond `Scope`
 */
export interface LiveCredential<
  out Tag extends string,
  out TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  out TRefreshContext,
>
  extends Pipeable.Pipeable {
  readonly [Readable.TypeId]: Readable.TypeId
  readonly [Subscribable.TypeId]: Subscribable.TypeId
  readonly get: Effect.Effect<TCredentialToken, CredentialError>
  readonly changes: Stream.Stream<
    Either.Either<TCredentialToken, CredentialError>
  >
  readonly refresh: Effect.Effect<
    void,
    TokenStreamError,
    TRefreshContext | Scope.Scope
  >
}

/**
 * Static metadata the credential service framework needs from a credential
 * class: the token schema for decoding and the buffer duration for scheduling
 * proactive refresh.
 */
export interface CredentialTokenDefinition<
  Tag extends string,
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  TCredentialTokenEncoded,
> {
  readonly schema: Schema.Schema<TCredentialToken, TCredentialTokenEncoded>
  readonly refreshBuffer: Duration.Duration
}

/**
 * A service that manages credentials by identity — creating, caching, and
 * returning live credentials.
 *
 * @typeParam Tag - Discriminant tag for the token type
 * @typeParam TIdentifier - The identity key used to look up a credential
 * @typeParam TCredentialToken - The token value type
 * @typeParam TTokenContext - Refresh context: Effect services the credential needs
 */
export interface CredentialRepository<
  Tag extends string,
  TIdentifier extends { readonly _tag: Tag },
  TCredentialToken extends CredentialToken<TCredentialToken, Tag>,
  TTokenContext,
> {
  /** Returns a live, observable credential for the given identity. Requires Scope for the watch lifecycle. */
  get(
    identifier: TIdentifier
  ): Effect.Effect<
    LiveCredential<Tag, TCredentialToken, TTokenContext>,
    never,
    Scope.Scope | TTokenContext
  >
}
