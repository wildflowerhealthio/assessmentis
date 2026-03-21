import { Effect, Schema } from 'effect'

import type { ReadonlyUrl, ResourceRequest } from '@assessmentis/effectful-store'
import { Resource } from '@assessmentis/effectful-store'
import { DataIntegrityError, NotFoundError, UnhandledError } from '@assessmentis/ontology'

import { Org } from '../models/org'
import type { PlatformRoutesService } from '../models/platform-urls'
import { User } from '../models/user'
import { UserOrg } from '../models/user-org'
import { AuthDataService } from '../tagClasses/auth-data-service'
import type { AuthData } from '../tagClasses/auth-data-service'
import { DocumentStore } from '../tagClasses/document-store'
import type { DocumentData, DocumentPath } from '../tagClasses/document-store'

import { PlatformRoutes } from './platform-routes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips `domainType` and `url` from encoded data before writing to
 * DocumentStore. These fields are Hub-only metadata, not stored in Firestore.
 */
const stripHubFields = (data: Record<string, unknown>): DocumentData => {
  const { domainType: _, url: __, ...rest } = data
  return rest
}

// ---------------------------------------------------------------------------
// Generic handler factories
// ---------------------------------------------------------------------------

/**
 * Creates a Get handler that reads from DocumentStore. Extracts a document
 * path from the request URL, reads the document, and decodes it with the
 * given Schema class.
 *
 * @param klass - The DomainClass to decode into
 * @param extractPath - Derives a DocumentPath from the URL via PlatformRoutes
 */
const makeDocumentStoreGetHandler = <K extends Resource.AnyDomainClass>(
  klass: K,
  extractPath: (
    routes: PlatformRoutesService,
    url: ReadonlyUrl
  ) => Effect.Effect<DocumentPath, DataIntegrityError>
) => {
  // Schema.decodeUnknown requires the schema at a concrete level
  const decode = Schema.decodeUnknown(klass as unknown as Schema.Schema<InstanceType<K>, unknown>)

  return (request: ResourceRequest.Get<K>) =>
    Effect.gen(function* () {
      const routes = yield* PlatformRoutes
      const store = yield* DocumentStore
      const path = yield* extractPath(routes, request.url)
      const data = yield* store.get(path)
      return yield* decode({ ...data, url: request.url.toString() })
    }).pipe(
      Effect.mapError((e) =>
        e._tag === 'NotFoundError'
          ? new NotFoundError({ resourceType: klass.DomainType, params: { url: request.url } })
          : e
      )
    )
}

/**
 * Creates a Get handler that reads from AuthDataService instead of
 * DocumentStore. Used for credentials derived from Firebase Auth
 * (e.g. DailyCoProxyToken).
 *
 * @param fromAuthData - Factory that constructs the token from auth data
 */
const makeAuthDataGetHandler =
  <K extends Resource.AnyDomainClass>(fromAuthData: (authData: AuthData) => InstanceType<K>) =>
  (request: ResourceRequest.Get<K>) =>
    Effect.gen(function* () {
      const authDataService = yield* AuthDataService
      const authData = yield* authDataService.authData
      const token = fromAuthData(authData) as InstanceType<K> & {
        cloneWith: (patch: object) => InstanceType<K>
      }
      return token.cloneWith({ url: request.url })
    }).pipe(
      Effect.catchTag('AuthError', (e) =>
        Effect.fail(new UnhandledError({ cause: e, message: 'Auth error reading credential' }))
      )
    )

/**
 * Creates an Update handler that writes to DocumentStore. Extracts a
 * document path from the resource URL, encodes the resource (stripping
 * Hub-only fields), and writes the update.
 *
 * @param klass - The DomainClass to encode from
 * @param extractPath - Derives a DocumentPath from the URL via PlatformRoutes
 */
const makeDocumentStoreUpdateHandler = <K extends Resource.AnyDomainClass>(
  klass: K,
  extractPath: (
    routes: PlatformRoutesService,
    url: ReadonlyUrl
  ) => Effect.Effect<DocumentPath, DataIntegrityError>
): ((
  request: ResourceRequest.Update<K>
) => Effect.Effect<
  Resource.WithResourceUrl<InstanceType<K>>,
  DataIntegrityError | UnhandledError,
  PlatformRoutes | DocumentStore
>) => {
  const encode = Schema.encodeSync(
    klass as unknown as Schema.Schema<InstanceType<K>, Record<string, unknown>>
  )

  return (request) =>
    Effect.gen(function* () {
      const routes = yield* PlatformRoutes
      const store = yield* DocumentStore
      const path = yield* extractPath(routes, request.resource.url)
      const encoded = encode(request.resource)
      yield* store.update(stripHubFields(encoded), path)
      return request.resource
    })
}

// ---------------------------------------------------------------------------
// Path extractors
// ---------------------------------------------------------------------------

const orgPath = (routes: PlatformRoutesService, url: ReadonlyUrl) =>
  routes
    .orgSlugFromUrl(url as typeof Org.UrlSchema.Type)
    .pipe(Effect.map((slug): DocumentPath => ['orgs', slug] satisfies DocumentPath))

const userPath = (routes: PlatformRoutesService, url: ReadonlyUrl) =>
  routes
    .userIdFromUrl(url as typeof User.UrlSchema.Type)
    .pipe(Effect.map((userId): DocumentPath => ['users', userId] satisfies DocumentPath))

const userOrgPath = (routes: PlatformRoutesService, url: ReadonlyUrl) =>
  Effect.all([
    routes.userIdFromUserOrgUrl(url as typeof UserOrg.UrlSchema.Type),
    routes.orgSlugFromUserOrgUrl(url as typeof UserOrg.UrlSchema.Type),
  ]).pipe(
    Effect.map(
      ([userId, slug]): DocumentPath => ['users', userId, 'orgs', slug] satisfies DocumentPath
    )
  )

const userCredentialPath = (routes: PlatformRoutesService, url: ReadonlyUrl) =>
  routes
    .userCredentialFromUrl(url as Parameters<PlatformRoutesService['userCredentialFromUrl']>[0])
    .pipe(
      Effect.map(
        ({ userId, credentialId }): DocumentPath =>
          ['users', userId, 'credentials', credentialId] satisfies DocumentPath
      )
    )

const serverCredentialPath = (routes: PlatformRoutesService, url: ReadonlyUrl) =>
  routes
    .serverCredentialFromUrl(url as Parameters<PlatformRoutesService['serverCredentialFromUrl']>[0])
    .pipe(
      Effect.map(
        ({ slug, credentialId }): DocumentPath =>
          ['orgs', slug, 'credentials', credentialId] satisfies DocumentPath
      )
    )

// ---------------------------------------------------------------------------
// Entity handlers
// ---------------------------------------------------------------------------

const handleOrgGet = makeDocumentStoreGetHandler(Org, orgPath)
const handleOrgUpdate = makeDocumentStoreUpdateHandler(Org, orgPath)
const handleUserGet = makeDocumentStoreGetHandler(User, userPath)
const handleUserUpdate = makeDocumentStoreUpdateHandler(User, userPath)
const handleUserOrgGet = makeDocumentStoreGetHandler(UserOrg, userOrgPath)
const handleUserOrgUpdate = makeDocumentStoreUpdateHandler(UserOrg, userOrgPath)

export {
  handleOrgGet,
  handleOrgUpdate,
  handleUserGet,
  handleUserOrgGet,
  handleUserOrgUpdate,
  handleUserUpdate,
  makeAuthDataGetHandler,
  makeDocumentStoreGetHandler,
  makeDocumentStoreUpdateHandler,
  serverCredentialPath,
  stripHubFields,
  userCredentialPath,
}
