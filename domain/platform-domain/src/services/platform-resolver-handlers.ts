import { Effect, Schema } from 'effect'

import type { ResourceRequest } from '@assessmentis/effectful-store'
import { Resource } from '@assessmentis/effectful-store'
import { DataIntegrityError, NotFoundError, UnhandledError } from '@assessmentis/ontology'

import { Org } from '../models/org'
import { User } from '../models/user'
import { UserOrg } from '../models/user-org'
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
// Org handlers
// ---------------------------------------------------------------------------

const handleOrgGet = (request: ResourceRequest.Get<typeof Org>) =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const slug = yield* routes.orgSlugFromUrl(request.url)
    const data = yield* store.get(['orgs', slug] satisfies DocumentPath)
    return yield* Schema.decodeUnknown(Org)({ ...data, url: request.url.toString() })
  }).pipe(
    Effect.mapError((e) =>
      e._tag === 'NotFoundError'
        ? new NotFoundError({ resourceType: Org.DomainType, params: { url: request.url } })
        : e
    )
  )

const handleOrgUpdate = (
  request: ResourceRequest.Update<typeof Org>
): Effect.Effect<
  Resource.WithResourceUrl<Org>,
  DataIntegrityError | UnhandledError,
  PlatformRoutes | DocumentStore
> =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const slug = yield* routes.orgSlugFromUrl(request.resource.url)
    const encoded = Schema.encodeSync(Org)(request.resource)
    yield* store.update(stripHubFields(encoded), ['orgs', slug] satisfies DocumentPath)
    return request.resource
  })

// ---------------------------------------------------------------------------
// User handlers
// ---------------------------------------------------------------------------

const handleUserGet = (request: ResourceRequest.Get<typeof User>) =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const userId = yield* routes.userIdFromUrl(request.url)
    const data = yield* store.get(['users', userId] satisfies DocumentPath)
    return yield* Schema.decodeUnknown(User)({ ...data, url: request.url.toString() })
  }).pipe(
    Effect.mapError((e) =>
      e._tag === 'NotFoundError'
        ? new NotFoundError({ resourceType: User.DomainType, params: { url: request.url } })
        : e
    )
  )

const handleUserUpdate = (
  request: ResourceRequest.Update<typeof User>
): Effect.Effect<
  Resource.WithResourceUrl<User>,
  DataIntegrityError | UnhandledError,
  PlatformRoutes | DocumentStore
> =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const userId = yield* routes.userIdFromUrl(request.resource.url)
    const encoded = Schema.encodeSync(User)(request.resource)
    yield* store.update(stripHubFields(encoded), ['users', userId] satisfies DocumentPath)
    return request.resource
  })

// ---------------------------------------------------------------------------
// UserOrg handlers
// ---------------------------------------------------------------------------

const handleUserOrgGet = (request: ResourceRequest.Get<typeof UserOrg>) =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const userId = yield* routes.userIdFromUserOrgUrl(request.url)
    const slug = yield* routes.orgSlugFromUserOrgUrl(request.url)
    const data = yield* store.get(['users', userId, 'orgs', slug] satisfies DocumentPath)
    return yield* Schema.decodeUnknown(UserOrg)({ ...data, url: request.url.toString() })
  }).pipe(
    Effect.mapError((e) =>
      e._tag === 'NotFoundError'
        ? new NotFoundError({ resourceType: UserOrg.DomainType, params: { url: request.url } })
        : e
    )
  )

const handleUserOrgUpdate = (
  request: ResourceRequest.Update<typeof UserOrg>
): Effect.Effect<
  Resource.WithResourceUrl<UserOrg>,
  DataIntegrityError | UnhandledError,
  PlatformRoutes | DocumentStore
> =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes
    const store = yield* DocumentStore
    const userId = yield* routes.userIdFromUserOrgUrl(request.resource.url)
    const slug = yield* routes.orgSlugFromUserOrgUrl(request.resource.url)
    const encoded = Schema.encodeSync(UserOrg)(request.resource)
    yield* store.update(stripHubFields(encoded), [
      'users',
      userId,
      'orgs',
      slug,
    ] satisfies DocumentPath)
    return request.resource
  })

export {
  handleOrgGet,
  handleOrgUpdate,
  handleUserGet,
  handleUserOrgGet,
  handleUserOrgUpdate,
  handleUserUpdate,
  stripHubFields,
}
