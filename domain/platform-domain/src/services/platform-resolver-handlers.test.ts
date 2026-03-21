import { Effect, Either, Layer, Schema, Stream } from 'effect'
import { describe, expect, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

import { OrgSlug } from '../models/id-types'
import { Org } from '../models/org'
import { PlatformRoutesService } from '../models/platform-urls'
import { User } from '../models/user'
import { UserId } from '../models/user-id'
import { UserOrg } from '../models/user-org'
import { DocumentStore } from '../tagClasses/document-store'
import type { DocumentData, DocumentPath } from '../tagClasses/document-store'

import {
  handleOrgGet,
  handleOrgUpdate,
  handleUserGet,
  handleUserOrgGet,
  handleUserOrgUpdate,
  handleUserUpdate,
  stripHubFields,
} from './platform-resolver-handlers'
import { PlatformRoutes } from './platform-routes'

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

class TestRoutes extends PlatformRoutesService {
  readonly documentBaseUrl = ReadonlyUrl.make({
    protocol: 'firebase:',
    host: 'test-project',
    pathname: '/firestore/test-db',
  })
  readonly currentUserUrl = ReadonlyUrl.make({
    protocol: 'firebase:',
    host: 'test-project',
    pathname: '/auth/currentUser',
  })
}

const testRoutes = new TestRoutes()

const routesLayer = Layer.succeed(PlatformRoutes, testRoutes)

const makeDocumentStoreLayer = (documents: Record<string, DocumentData>) => {
  const store: typeof DocumentStore.Service = {
    get: (path: DocumentPath) => {
      const key = path.join('/')
      const data = documents[key]
      if (data === undefined) {
        return Effect.fail(new NotFoundError({ resourceType: 'Document', params: { path } }))
      }
      return Effect.succeed(data)
    },
    subscribeTo: (path: DocumentPath) => Stream.make(Either.right(documents[path.join('/')] ?? {})),
    set: (_data: DocumentData, _path: DocumentPath) => Effect.void,
    update: (_data: Partial<DocumentData>, _path: DocumentPath) => Effect.void,
  }
  return Layer.succeed(DocumentStore, store)
}

const runWithLayers = <A, E>(
  effect: Effect.Effect<A, E, PlatformRoutes | DocumentStore>,
  documents: Record<string, DocumentData>
) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(Layer.merge(routesLayer, makeDocumentStoreLayer(documents))))
  )

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('stripHubFields', () => {
  test('removes domainType and url', () => {
    const result = stripHubFields({
      domainType: 'Org',
      url: 'firebase://test/orgs/acme',
      slug: 'acme',
      emoji: '🏥',
    })
    expect(result).toEqual({ slug: 'acme', emoji: '🏥' })
    expect(result).not.toHaveProperty('domainType')
    expect(result).not.toHaveProperty('url')
  })
})

describe('handleOrgGet', () => {
  test('reads org from DocumentStore and attaches URL', async () => {
    const url = testRoutes.orgUrl(OrgSlug.make('acme'))
    const request = {
      _tag: 'Get' as const,
      klass: Org,
      url,
      origin: testRoutes.documentBaseUrl,
    }

    const result = await runWithLayers(handleOrgGet(request), {
      'orgs/acme': { slug: 'acme', emoji: '🏥' },
    })

    expect(result.slug).toBe('acme')
    expect(result.emoji).toBe('🏥')
    expect(result.domainType).toBe('Org')
    expect(result.url).toBeDefined()
  })

  test('fails with NotFoundError when document is missing', async () => {
    const url = testRoutes.orgUrl(OrgSlug.make('missing'))
    const request = {
      _tag: 'Get' as const,
      klass: Org,
      url,
      origin: testRoutes.documentBaseUrl,
    }

    const exit = await Effect.runPromiseExit(
      handleOrgGet(request).pipe(
        Effect.provide(Layer.merge(routesLayer, makeDocumentStoreLayer({})))
      )
    )

    expect(exit._tag).toBe('Failure')
  })
})

describe('handleOrgUpdate', () => {
  test('strips domainType and url before writing', async () => {
    const url = testRoutes.orgUrl(OrgSlug.make('acme'))
    const org = Schema.decodeSync(Org)({ slug: 'acme', emoji: '🏢' })
    const orgWithUrl = org.cloneWith({ url }) as Org & { readonly url: NonNullable<Org['url']> }

    let writtenData: Partial<DocumentData> | undefined
    let writtenPath: DocumentPath | undefined

    const storeLayer = Layer.succeed(DocumentStore, {
      get: () => Effect.fail(new UnhandledError({ message: 'not used' })),
      subscribeTo: () => Stream.empty,
      set: () => Effect.void,
      update: (data, path) => {
        writtenData = data
        writtenPath = path
        return Effect.void
      },
    })

    const request = {
      _tag: 'Update' as const,
      klass: Org,
      resource: orgWithUrl,
      origin: testRoutes.documentBaseUrl,
    }

    await Effect.runPromise(
      handleOrgUpdate(request).pipe(Effect.provide(Layer.merge(routesLayer, storeLayer)))
    )

    expect(writtenData).not.toHaveProperty('domainType')
    expect(writtenData).not.toHaveProperty('url')
    expect(writtenPath).toEqual(['orgs', 'acme'])
  })
})

describe('handleUserGet', () => {
  test('reads user from DocumentStore and attaches URL', async () => {
    const uid = UserId.make('user-123')
    const url = testRoutes.userUrl(uid)
    const request = {
      _tag: 'Get' as const,
      klass: User,
      url,
      origin: testRoutes.documentBaseUrl,
    }

    const result = await runWithLayers(handleUserGet(request), {
      'users/user-123': { uid: 'user-123', org_roles: {} },
    })

    expect(result.uid).toBe('user-123')
    expect(result.domainType).toBe('User')
    expect(result.url).toBeDefined()
  })
})

describe('handleUserOrgGet', () => {
  test('reads user-org from DocumentStore and attaches URL', async () => {
    const uid = UserId.make('user-123')
    const slug = OrgSlug.make('acme')
    const url = testRoutes.userOrgUrl(uid, slug)
    const request = {
      _tag: 'Get' as const,
      klass: UserOrg,
      url,
      origin: testRoutes.documentBaseUrl,
    }

    const result = await runWithLayers(handleUserOrgGet(request), {
      'users/user-123/orgs/acme': {},
    })

    expect(result.domainType).toBe('UserOrg')
    expect(result.url).toBeDefined()
  })
})

describe('handleUserOrgUpdate', () => {
  test('strips domainType and url before writing', async () => {
    const uid = UserId.make('user-123')
    const slug = OrgSlug.make('acme')
    const url = testRoutes.userOrgUrl(uid, slug)
    const userOrg = Schema.decodeSync(UserOrg)({})
    const userOrgWithUrl = userOrg.cloneWith({ url }) as UserOrg & {
      readonly url: NonNullable<UserOrg['url']>
    }

    let writtenPath: DocumentPath | undefined

    const storeLayer = Layer.succeed(DocumentStore, {
      get: () => Effect.fail(new UnhandledError({ message: 'not used' })),
      subscribeTo: () => Stream.empty,
      set: () => Effect.void,
      update: (_data, path) => {
        writtenPath = path
        return Effect.void
      },
    })

    const request = {
      _tag: 'Update' as const,
      klass: UserOrg,
      resource: userOrgWithUrl,
      origin: testRoutes.documentBaseUrl,
    }

    await Effect.runPromise(
      handleUserOrgUpdate(request).pipe(Effect.provide(Layer.merge(routesLayer, storeLayer)))
    )

    expect(writtenPath).toEqual(['users', 'user-123', 'orgs', 'acme'])
  })
})
