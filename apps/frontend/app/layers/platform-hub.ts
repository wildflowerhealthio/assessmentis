import { Context, Effect, Schema } from 'effect'

import {
  DailyCoApiKeyToken,
  DailyCoProxyLiveCredential,
  DailyCoProxyToken,
} from '@assessmentis/daily-co-infrastructure'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { GoogleUserOAuthToken } from '@assessmentis/google-account-infrastructure'
import { UnhandledError } from '@assessmentis/ontology'
import {
  AuthDataService,
  DocumentStore,
  Org,
  PlatformRoutes,
  User,
  UserOrg,
  entityHandlers,
  makeStaticPlatformHub,
} from '@assessmentis/platform-domain'
import type { DocumentPath, HandlerRegistry } from '@assessmentis/platform-domain'

import type { PlatformDomainClasses } from './platform-credential-classes'

// ---------------------------------------------------------------------------
// Credential handlers
// ---------------------------------------------------------------------------

const handleGoogleOAuthGet = (request: ResourceRequest.Get<typeof GoogleUserOAuthToken>) =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const { userId, credentialId } = yield* routes.userCredentialFromUrl(request.url)
    const data = yield* store.get([
      'users',
      userId,
      'credentials',
      credentialId,
    ] satisfies DocumentPath)
    return yield* Schema.decodeUnknown(GoogleUserOAuthToken)({
      ...data,
      url: request.url.toString(),
    })
  })

const handleDailyCoApiKeyGet = (request: ResourceRequest.Get<typeof DailyCoApiKeyToken>) =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const { slug, credentialId } = yield* routes.serverCredentialFromUrl(request.url)
    const data = yield* store.get([
      'orgs',
      slug,
      'credentials',
      credentialId,
    ] satisfies DocumentPath)
    return yield* Schema.decodeUnknown(DailyCoApiKeyToken)({
      ...data,
      url: request.url.toString(),
    })
  })

const handleDailyCoProxyGet = (request: ResourceRequest.Get<typeof DailyCoProxyToken>) =>
  Effect.gen(function* () {
    const authDataService = yield* AuthDataService
    const authData = yield* authDataService.authData
    const token = DailyCoProxyLiveCredential.fromAuthData(authData)
    return token.cloneWith({ url: request.url }) as DailyCoProxyToken & {
      readonly url: NonNullable<DailyCoProxyToken['url']>
    }
  }).pipe(
    Effect.catchTag('AuthError', (e) =>
      Effect.fail(new UnhandledError({ cause: e, message: 'Auth error reading proxy token' }))
    )
  )

// ---------------------------------------------------------------------------
// Full handler registry and Hub creation
// ---------------------------------------------------------------------------

const platformHandlerRegistry: HandlerRegistry<PlatformDomainClasses> = {
  get: {
    ...entityHandlers.get,
    [GoogleUserOAuthToken.DomainType]: handleGoogleOAuthGet,
    [DailyCoApiKeyToken.DomainType]: handleDailyCoApiKeyGet,
    [DailyCoProxyToken.DomainType]: handleDailyCoProxyGet,
  },
  update: {
    ...entityHandlers.update,
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
const makePlatformHub = Effect.gen(function* () {
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
