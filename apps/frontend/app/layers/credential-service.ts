import { HttpClient } from '@effect/platform'
import { Context, Effect, Layer } from 'effect'
import type { Schema, Scope } from 'effect'

import { DailyCoProxyLiveCredential } from '@assessmentis/daily-co-infrastructure'
import type {
  DailyCoProxyIdentifier,
  DailyCoProxyToken,
} from '@assessmentis/daily-co-infrastructure'
import { GoogleUserOAuthLiveCredential } from '@assessmentis/google-account-infrastructure'
import type {
  GoogleUserCredentialIdentifier,
  GoogleUserOAuthToken,
} from '@assessmentis/google-account-infrastructure'
import {
  AuthDataService,
  makeAuthDataCredentialRepository,
  makeDocumentStoreCredentialRepository,
} from '@assessmentis/platform-domain'
import type { LiveCredential } from '@assessmentis/platform-domain'

type GoogleUserOAuthTokenEncoded = Schema.Schema.Encoded<
  typeof GoogleUserOAuthLiveCredential.schema
>

/**
 * Composite credential service that provides type-safe access to all
 * credential types in the system. Dispatches by `_tag` on the identifier.
 *
 * All refresh contexts are captured at construction time — callers only
 * need `Scope`.
 */
export class CredentialService extends Context.Tag('CredentialService')<
  CredentialService,
  {
    get(
      identifier: GoogleUserCredentialIdentifier
    ): Effect.Effect<
      LiveCredential<
        'google_user_oauth_token',
        GoogleUserOAuthToken,
        AuthDataService | HttpClient.HttpClient
      >,
      never,
      Scope.Scope
    >
    get(
      identifier: DailyCoProxyIdentifier
    ): Effect.Effect<LiveCredential<'dailyco_proxy', DailyCoProxyToken, never>, never, Scope.Scope>
  }
>() {}

/**
 * Creates the composite credential service.
 *
 * Requires DocumentStore (for per-type services) and all refresh context
 * services, which are captured so that `get` only needs `Scope`.
 */
export const makeCredentialService = Effect.gen(function* makeCredentialService() {
  // Per-type services
  const googleOAuthRepository = yield* makeDocumentStoreCredentialRepository<
    'google_user_oauth_token',
    GoogleUserCredentialIdentifier,
    GoogleUserOAuthToken,
    GoogleUserOAuthTokenEncoded,
    AuthDataService | HttpClient.HttpClient,
    typeof GoogleUserOAuthLiveCredential
  >(GoogleUserOAuthLiveCredential)

  const dailyCoProxyCredential: LiveCredential<'dailyco_proxy', DailyCoProxyToken, never> =
    yield* makeAuthDataCredentialRepository<'dailyco_proxy', DailyCoProxyToken>(
      DailyCoProxyLiveCredential
    )

  // Capture refresh context services
  const authDataService = yield* AuthDataService
  const httpClient = yield* HttpClient.HttpClient

  const googleOAuthContextLayer = Layer.mergeAll(
    Layer.succeed(AuthDataService, authDataService),
    Layer.succeed(HttpClient.HttpClient, httpClient)
  )

  // Overloaded function — implementation signature accepts the union,
  // Individual overloads narrow the return type per identifier tag.
  function get(
    identifier: GoogleUserCredentialIdentifier
  ): Effect.Effect<
    LiveCredential<
      'google_user_oauth_token',
      GoogleUserOAuthToken,
      AuthDataService | HttpClient.HttpClient
    >,
    never,
    Scope.Scope
  >
  function get(
    identifier: DailyCoProxyIdentifier
  ): Effect.Effect<LiveCredential<'dailyco_proxy', DailyCoProxyToken, never>, never, Scope.Scope>
  function get(
    identifier: GoogleUserCredentialIdentifier | DailyCoProxyIdentifier
  ): Effect.Effect<
    | LiveCredential<
        'google_user_oauth_token',
        GoogleUserOAuthToken,
        AuthDataService | HttpClient.HttpClient
      >
    | LiveCredential<'dailyco_proxy', DailyCoProxyToken, never>,
    never,
    Scope.Scope
  > {
    switch (identifier._tag) {
      case 'google_user_oauth_token': {
        return googleOAuthRepository.get(identifier).pipe(Effect.provide(googleOAuthContextLayer))
      }
      case 'dailyco_proxy': {
        return Effect.succeed(dailyCoProxyCredential)
      }
    }
  }

  return CredentialService.of({ get })
})
