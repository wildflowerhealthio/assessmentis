import { Context, Effect, Either, HashMap, RequestResolver, Schema, SubscriptionRef } from 'effect'

import {
  DailyCoApiKeyToken,
  DailyCoProxyLiveCredential,
  DailyCoProxyToken,
} from '@assessmentis/daily-co-infrastructure'
import { Hub, Origin, ReadonlyUrl, ResourceRequest } from '@assessmentis/effectful-store'
import { GoogleUserOAuthToken } from '@assessmentis/google-account-infrastructure'
import { UnhandledError } from '@assessmentis/ontology'
import type { DataIntegrityError, NotFoundError } from '@assessmentis/ontology'
import {
  AuthDataService,
  DocumentStore,
  Org,
  PlatformRoutes,
  User,
  UserOrg,
  handleOrgGet,
  handleOrgUpdate,
  handleUserGet,
  handleUserOrgGet,
  handleUserOrgUpdate,
  handleUserUpdate,
  stripHubFields,
} from '@assessmentis/platform-domain'
import type { DocumentPath } from '@assessmentis/platform-domain'

import type { PlatformDomainClasses } from './platform-credential-classes'

// ---------------------------------------------------------------------------
// Credential handlers
// ---------------------------------------------------------------------------

const handleGoogleOAuthGet = (
  request: ResourceRequest.Get<typeof GoogleUserOAuthToken>
): Effect.Effect<
  GoogleUserOAuthToken & { readonly url: NonNullable<GoogleUserOAuthToken['url']> },
  DataIntegrityError | NotFoundError | UnhandledError,
  typeof PlatformRoutes.Service | typeof DocumentStore.Service
> =>
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

const handleDailyCoApiKeyGet = (
  request: ResourceRequest.Get<typeof DailyCoApiKeyToken>
): Effect.Effect<
  DailyCoApiKeyToken & { readonly url: NonNullable<DailyCoApiKeyToken['url']> },
  DataIntegrityError | NotFoundError | UnhandledError,
  typeof PlatformRoutes.Service | typeof DocumentStore.Service
> =>
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

const handleDailyCoProxyGet = (
  request: ResourceRequest.Get<typeof DailyCoProxyToken>
): Effect.Effect<
  DailyCoProxyToken & { readonly url: NonNullable<DailyCoProxyToken['url']> },
  UnhandledError,
  typeof AuthDataService.Service
> =>
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
// Composed resolver
// ---------------------------------------------------------------------------

type ResolverDeps =
  | typeof PlatformRoutes.Service
  | typeof DocumentStore.Service
  | typeof AuthDataService.Service

const makePlatformResolver = (): RequestResolver.RequestResolver<
  Origin.AnyResourceRequest<PlatformDomainClasses>,
  ResolverDeps
> =>
  RequestResolver.fromEffect((request: Origin.AnyResourceRequest<PlatformDomainClasses>) => {
    switch (request._tag) {
      case 'Get': {
        return dispatchGet(request)
      }
      case 'Update': {
        return dispatchUpdate(request)
      }
      case 'Search': {
        return Effect.fail(
          new UnhandledError({ message: 'Search not supported for platform resources' })
        )
      }
      case 'Create': {
        return Effect.fail(
          new UnhandledError({ message: 'Create not yet supported for platform resources' })
        )
      }
      case 'Delete': {
        return Effect.fail(
          new UnhandledError({ message: 'Delete not yet supported for platform resources' })
        )
      }
    }
  })

const dispatchGet = (request: ResourceRequest.Get<PlatformDomainClasses>) => {
  switch (request.klass.DomainType) {
    case Org.DomainType: {
      return handleOrgGet(request as ResourceRequest.Get<typeof Org>)
    }
    case User.DomainType: {
      return handleUserGet(request as ResourceRequest.Get<typeof User>)
    }
    case UserOrg.DomainType: {
      return handleUserOrgGet(request as ResourceRequest.Get<typeof UserOrg>)
    }
    case GoogleUserOAuthToken.DomainType: {
      return handleGoogleOAuthGet(request as ResourceRequest.Get<typeof GoogleUserOAuthToken>)
    }
    case DailyCoApiKeyToken.DomainType: {
      return handleDailyCoApiKeyGet(request as ResourceRequest.Get<typeof DailyCoApiKeyToken>)
    }
    case DailyCoProxyToken.DomainType: {
      return handleDailyCoProxyGet(request as ResourceRequest.Get<typeof DailyCoProxyToken>)
    }
  }
}

const dispatchUpdate = (request: ResourceRequest.Update<PlatformDomainClasses>) => {
  switch (request.klass.DomainType) {
    case Org.DomainType: {
      return handleOrgUpdate(request as ResourceRequest.Update<typeof Org>)
    }
    case User.DomainType: {
      return handleUserUpdate(request as ResourceRequest.Update<typeof User>)
    }
    case UserOrg.DomainType: {
      return handleUserOrgUpdate(request as ResourceRequest.Update<typeof UserOrg>)
    }
    default: {
      return Effect.fail(
        new UnhandledError({
          message: `Update not supported for ${request.klass.DomainType}`,
        })
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Static Hub creation
// ---------------------------------------------------------------------------

/**
 * Creates a static {@link Hub} for platform entities and credentials.
 *
 * @remarks
 * Unlike the clinical Hub which is dynamic (origins come and go as org config
 * changes), the platform Hub has a single, static origin that exists once
 * the user is authenticated. No `hubStateStream` or `OriginFactory` needed.
 */
const makePlatformHub = Effect.gen(function* () {
  const routes = yield* PlatformRoutes
  const store = yield* DocumentStore
  const authDataService = yield* AuthDataService

  const originUrl = ReadonlyUrl.make({
    protocol: routes.documentBaseUrl.protocol,
    host: routes.documentBaseUrl.host,
    pathname: '/',
  })

  const resolver = makePlatformResolver().pipe(
    RequestResolver.provideContext(
      Context.make(PlatformRoutes, routes).pipe(
        Context.add(DocumentStore, store),
        Context.add(AuthDataService, authDataService)
      )
    )
  )

  const origin: Origin.Ready<PlatformDomainClasses> = {
    errorStatus: undefined,
    originUrl,
    provokeReauthenticate: () => Effect.void,
    provokeReauthorize: () => Effect.void,
    resolver,
    supportedResources: {
      [Org.DomainType]: Org,
      [User.DomainType]: User,
      [UserOrg.DomainType]: UserOrg,
      [GoogleUserOAuthToken.DomainType]: GoogleUserOAuthToken,
      [DailyCoApiKeyToken.DomainType]: DailyCoApiKeyToken,
      [DailyCoProxyToken.DomainType]: DailyCoProxyToken,
    },
  }

  const hubState = HashMap.make([originUrl.toString(), origin])
  const stateRef = yield* SubscriptionRef.make(Either.right(hubState))
  return Hub.makeHubFromRef<PlatformDomainClasses>(stateRef)
})

// ---------------------------------------------------------------------------
// Context tag
// ---------------------------------------------------------------------------

/**
 * Effect context tag for the platform Hub. Provides typed CRUD access to
 * platform entities (Org, User, UserOrg) and credentials (GoogleUserOAuthToken,
 * DailyCoApiKeyToken, DailyCoProxyToken).
 */
class PlatformHub extends Context.Tag('PlatformHub')<
  PlatformHub,
  Hub.Hub<PlatformDomainClasses>
>() {}

export { PlatformHub, makePlatformHub }
