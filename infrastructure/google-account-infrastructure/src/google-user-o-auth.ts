import { HttpBody, HttpClient } from '@effect/platform'
import { DateTime, Effect, Option, Schema, pipe } from 'effect'
import type { Either, Scope, SubscriptionRef } from 'effect'

import { makeCredentialId } from '@assessmentis/config-domain'
import { AuthError, UnhandledError } from '@assessmentis/ontology'
import type { DataIntegrityError, NotFoundError } from '@assessmentis/ontology'
import { AuthDataService, DocumentStoreLiveCredential } from '@assessmentis/platform-domain'
import type {
  CredentialError,
  DocumentPath,
  DocumentStore,
  RefreshableCredentialToken,
  TokenStreamError,
} from '@assessmentis/platform-domain'
import { DateTimeUtcFromFirebaseTimestamp } from '@assessmentis/util'

const tag = 'google_user_oauth_token' as const

/** Decoded OAuth token for a Google user */
export class GoogleUserOAuthToken
  extends Schema.TaggedClass<GoogleUserOAuthToken>('GoogleUserOAuthToken')(tag, {
    accessToken: Schema.String,
    email: Schema.String,
    expiresAt: DateTimeUtcFromFirebaseTimestamp,
    refreshToken: Schema.optionalWith(Schema.String, { as: 'Option' }),
    scope: Schema.String,
  })
  implements RefreshableCredentialToken<GoogleUserOAuthToken, typeof tag>
{
  asInvalidated(): GoogleUserOAuthToken {
    return new GoogleUserOAuthToken({
      // oxlint-disable-next-line typescript/no-misused-spread
      ...this,
      accessToken: '',
      expiresAt: DateTime.toUtc(DateTime.unsafeMake(0)),
      refreshToken: Option.none(),
    })
  }

  withRefreshedAccess(accessToken: string, expiresAt: DateTime.Utc): GoogleUserOAuthToken {
    // oxlint-disable-next-line typescript/no-misused-spread
    return new GoogleUserOAuthToken({ ...this, accessToken, expiresAt })
  }
}

/** Identity key for looking up a Google user's OAuth credential. */
export interface GoogleUserCredentialIdentifier {
  readonly _tag: typeof tag
  readonly userId: string
  readonly email: string
}

/**
 * Live credential that refreshes Google OAuth tokens via an HTTP endpoint.
 *
 * Refresh context: {@link AuthDataService} (bearer token for the request)
 * and {@link HttpClient.HttpClient} (to call the refresh endpoint).
 *
 * **Important:** The refresh method issues requests to relative URLs
 * (e.g. `/api/credentials/...`). The provided {@link HttpClient.HttpClient}
 * must be configured with the appropriate base URL for this to resolve
 * correctly.
 */
export class GoogleUserOAuthLiveCredential extends DocumentStoreLiveCredential<
  typeof tag,
  GoogleUserOAuthToken,
  AuthDataService | HttpClient.HttpClient
> {
  static readonly schema = GoogleUserOAuthToken

  static pathFor(identity: GoogleUserCredentialIdentifier): DocumentPath {
    return ['users', identity.userId, 'credentials', makeCredentialId(tag, identity.email)]
  }

  static readOnce(
    identity: GoogleUserCredentialIdentifier
  ): Effect.Effect<
    GoogleUserOAuthToken,
    DataIntegrityError | NotFoundError<'Document', { path: readonly string[] }> | UnhandledError,
    DocumentStore
  > {
    return DocumentStoreLiveCredential._readOnce(
      GoogleUserOAuthToken,
      GoogleUserOAuthLiveCredential.pathFor(identity)
    )
  }

  static store(
    identity: GoogleUserCredentialIdentifier,
    token: GoogleUserOAuthToken
  ): Effect.Effect<void, UnhandledError, DocumentStore> {
    return DocumentStoreLiveCredential._store(
      GoogleUserOAuthToken,
      GoogleUserOAuthLiveCredential.pathFor(identity),
      token
    )
  }

  private readonly email: string

  constructor(
    identity: GoogleUserCredentialIdentifier,
    stateRef: SubscriptionRef.SubscriptionRef<Either.Either<GoogleUserOAuthToken, CredentialError>>
  ) {
    super(GoogleUserOAuthLiveCredential.pathFor(identity), stateRef)
    this.email = identity.email
  }

  readonly refresh: Effect.Effect<
    void,
    TokenStreamError,
    AuthDataService | HttpClient.HttpClient | Scope.Scope
  > = pipe(
    Effect.all([AuthDataService.getAuthData(), HttpClient.HttpClient]),
    Effect.flatMap(([{ authToken }, httpClient]) =>
      pipe(
        HttpBody.json({}),
        Effect.mapError(
          (cause) =>
            new UnhandledError({
              cause,
              message: 'Failed to serialize refresh request body',
            })
        ),
        Effect.flatMap((body) =>
          httpClient.post(
            `/api/credentials/${encodeURIComponent(makeCredentialId(tag, this.email))}`,
            {
              body,
              headers: {
                'Content-Type': 'application/json',
                authorization: 'Bearer ' + authToken,
              },
            }
          )
        ),
        Effect.mapError(
          (cause) =>
            new AuthError({
              cause,
              message: 'Failed to refresh Google OAuth token',
            })
        ),
        Effect.tap(() => Effect.log('Finished refreshing token')),
        Effect.asVoid
      )
    )
  )
}
