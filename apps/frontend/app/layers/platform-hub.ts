import { Context, Effect } from 'effect'

import {
  DailyCoApiKeyToken,
  DailyCoProxyLiveCredential,
  DailyCoProxyToken,
} from '@assessmentis/daily-co-infrastructure'
import type { Hub } from '@assessmentis/effectful-store'
import { GoogleUserOAuthToken } from '@assessmentis/google-account-infrastructure'
import {
  AuthDataService,
  DocumentStore,
  Org,
  PlatformRoutes,
  User,
  UserOrg,
  entityTypeHandlers,
  makeAuthDataGetHandler,
  makeDocumentStoreGetHandler,
  makeStaticPlatformHub,
  serverCredentialPath,
  userCredentialPath,
} from '@assessmentis/platform-domain'
import type { HandlerRegistry } from '@assessmentis/platform-domain'

import type { PlatformDomainClasses } from './platform-credential-classes'

// ---------------------------------------------------------------------------
// Credential handlers (one-liners via generic helpers)
// ---------------------------------------------------------------------------

const handleGoogleOAuthGet = makeDocumentStoreGetHandler(
  GoogleUserOAuthToken,
  GoogleUserOAuthToken,
  userCredentialPath
)
const handleDailyCoApiKeyGet = makeDocumentStoreGetHandler(
  DailyCoApiKeyToken,
  DailyCoApiKeyToken,
  serverCredentialPath
)
const handleDailyCoProxyGet = makeAuthDataGetHandler(DailyCoProxyLiveCredential.fromAuthData)

// ---------------------------------------------------------------------------
// Full handler registry and Hub creation
// ---------------------------------------------------------------------------

const platformHandlerRegistry: HandlerRegistry<PlatformDomainClasses> = {
  handlers: {
    ...entityTypeHandlers,
    [GoogleUserOAuthToken.DomainType]: { get: handleGoogleOAuthGet },
    [DailyCoApiKeyToken.DomainType]: { get: handleDailyCoApiKeyGet },
    [DailyCoProxyToken.DomainType]: { get: handleDailyCoProxyGet },
  },
  supportedResources: {
    [Org.DomainType]: Org,
    [User.DomainType]: User,
    [UserOrg.DomainType]: UserOrg,
    [GoogleUserOAuthToken.DomainType]: GoogleUserOAuthToken,
    [DailyCoApiKeyToken.DomainType]: DailyCoApiKeyToken,
    [DailyCoProxyToken.DomainType]: DailyCoProxyToken,
  },
}

/**
 * Creates the platform Hub with all entity and credential handlers wired up.
 * Requires PlatformRoutes, DocumentStore, and AuthDataService in the Effect context.
 */
const makePlatformHub: Effect.Effect<
  Hub.Hub<PlatformDomainClasses>,
  never,
  PlatformRoutes | DocumentStore | AuthDataService
> = Effect.gen(function* () {
  const routes = yield* PlatformRoutes
  const store = yield* DocumentStore
  const authDataService = yield* AuthDataService

  const resolverContext = Context.make(PlatformRoutes, routes).pipe(
    Context.add(DocumentStore, store),
    Context.add(AuthDataService, authDataService)
  )

  return yield* makeStaticPlatformHub(platformHandlerRegistry, resolverContext)
})

export { makePlatformHub }
