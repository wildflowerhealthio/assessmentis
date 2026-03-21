import { Effect, Schema } from 'effect'

import type { ResourceRequest } from '@assessmentis/effectful-store'
import { Resource } from '@assessmentis/effectful-store'
import { DataIntegrityError, NotFoundError, UnhandledError } from '@assessmentis/ontology'

import type { ServerCredentialUrl, UserCredentialUrl } from '../models/credential-url-schemas'
import { Org } from '../models/org'
import type { OrgUrl, PlatformRoutesService, UserOrgUrl, UserUrl } from '../models/platform-urls'
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
 * given schema.
 *
 * @param klass - The DomainClass (for DomainType and URL type)
 * @param schema - The Schema to decode documents into instances
 * @param extractPath - Derives a DocumentPath from the request URL via PlatformRoutes
 */
const makeDocumentStoreGetHandler = <K extends Resource.AnyDomainClass, I>(
  klass: K,
  schema: Schema.Schema<InstanceType<K>, I>,
  extractPath: (
    routes: PlatformRoutesService,
    url: Resource.InferResourceUrl<InstanceType<K>>
  ) => Effect.Effect<DocumentPath, DataIntegrityError>
) => {
  const decode = Schema.decodeUnknown(schema)

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
 * @param fromAuthData - Factory that constructs a token with `cloneWith` from auth data
 */
const makeAuthDataGetHandler =
  <K extends Resource.AnyDomainClass>(
    fromAuthData: (
      authData: AuthData
    ) => InstanceType<K> & { cloneWith: (patch: object) => InstanceType<K> }
  ) =>
  (request: ResourceRequest.Get<K>) =>
    Effect.gen(function* () {
      const authDataService = yield* AuthDataService
      const authData = yield* authDataService.authData
      const token = fromAuthData(authData)
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
 * @param schema - The Schema to encode instances for storage
 * @param extractPath - Derives a DocumentPath from the resource URL via PlatformRoutes
 */
const makeDocumentStoreUpdateHandler = <
  K extends Resource.AnyDomainClass,
  I extends Record<string, unknown>,
>(
  klass: K,
  schema: Schema.Schema<InstanceType<K>, I>,
  extractPath: (
    routes: PlatformRoutesService,
    url: Resource.InferResourceUrl<InstanceType<K>>
  ) => Effect.Effect<DocumentPath, DataIntegrityError>
): ((
  request: ResourceRequest.Update<K>
) => Effect.Effect<
  Resource.WithResourceUrl<InstanceType<K>>,
  DataIntegrityError | UnhandledError,
  PlatformRoutes | DocumentStore
>) => {
  const encode = Schema.encodeSync(schema)

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
// Path extractors — typed to the branded URL each route parser expects
// ---------------------------------------------------------------------------

const orgPath = (routes: PlatformRoutesService, url: OrgUrl) =>
  routes
    .orgSlugFromUrl(url)
    .pipe(Effect.map((slug): DocumentPath => ['orgs', slug] satisfies DocumentPath))

const userPath = (routes: PlatformRoutesService, url: UserUrl) =>
  routes
    .userIdFromUrl(url)
    .pipe(Effect.map((userId): DocumentPath => ['users', userId] satisfies DocumentPath))

const userOrgPath = (routes: PlatformRoutesService, url: UserOrgUrl) =>
  Effect.all([routes.userIdFromUserOrgUrl(url), routes.orgSlugFromUserOrgUrl(url)]).pipe(
    Effect.map(
      ([userId, slug]): DocumentPath => ['users', userId, 'orgs', slug] satisfies DocumentPath
    )
  )

const userCredentialPath = (routes: PlatformRoutesService, url: UserCredentialUrl) =>
  routes
    .userCredentialFromUrl(url)
    .pipe(
      Effect.map(
        ({ userId, credentialId }): DocumentPath =>
          ['users', userId, 'credentials', credentialId] satisfies DocumentPath
      )
    )

const serverCredentialPath = (routes: PlatformRoutesService, url: ServerCredentialUrl) =>
  routes
    .serverCredentialFromUrl(url)
    .pipe(
      Effect.map(
        ({ slug, credentialId }): DocumentPath =>
          ['orgs', slug, 'credentials', credentialId] satisfies DocumentPath
      )
    )

// ---------------------------------------------------------------------------
// Entity handlers
// ---------------------------------------------------------------------------

const handleOrgGet = makeDocumentStoreGetHandler(Org, Org, orgPath)
const handleOrgUpdate = makeDocumentStoreUpdateHandler(Org, Org, orgPath)
const handleUserGet = makeDocumentStoreGetHandler(User, User, userPath)
const handleUserUpdate = makeDocumentStoreUpdateHandler(User, User, userPath)
const handleUserOrgGet = makeDocumentStoreGetHandler(UserOrg, UserOrg, userOrgPath)
const handleUserOrgUpdate = makeDocumentStoreUpdateHandler(UserOrg, UserOrg, userOrgPath)

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
