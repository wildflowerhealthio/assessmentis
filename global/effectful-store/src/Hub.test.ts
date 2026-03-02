import { assert, describe, expect, vi } from 'vitest'
import { it } from '@effect/vitest'
import {
  Array,
  Effect,
  Exit,
  Cause,
  RequestResolver,
  FastCheck as fc,
  Request,
} from 'effect'
import { makeHub } from './Hub'
import type { Hub } from './Hub'
import type { ReadyOrigin, NotReadyOrigin } from './OriginState'
import type * as ResourceRequest from './ResourceRequest'
import type * as Resource from './Resource'
import { ReadonlyUrl } from './ReadonlyUrl'
import { AuthError, AuthzError, Loading } from '@assessmentis/ontology'

// --- Resource types ---

interface TestResource extends Resource.Resource<'TestResource'> {
  readonly domainType: 'TestResource'
  readonly url?: ReadonlyUrl | undefined
  readonly name: string
}

interface OtherResource extends Resource.Resource<'OtherResource'> {
  readonly domainType: 'OtherResource'
  readonly url?: ReadonlyUrl | undefined
  readonly value: number
}

type TestResources = {
  readonly TestResource: TestResource
  readonly OtherResource: OtherResource
}

type TR = TestResources['TestResource']

const testResourcesMap: TestResources = {
  TestResource: { domainType: 'TestResource', name: '' },
  OtherResource: { domainType: 'OtherResource', value: 0 },
}

// --- Builders ---

const noopProvoke = () => Effect.void

type AnyTestRequest =
  | ResourceRequest.Get<TestResources[keyof TestResources]>
  | ResourceRequest.Search<TestResources[keyof TestResources]>
  | ResourceRequest.Create<TestResources[keyof TestResources]>
  | ResourceRequest.Update<TestResources[keyof TestResources]>
  | ResourceRequest.Delete<TestResources[keyof TestResources]>

/** Verified mock: embeds provenance (origin tag) in responses so tests can
 *  assert which resolver produced a result. */
const makeTrackedResolver = (originUrl: ReadonlyUrl) => {
  const tag = originUrl.toString()
  const handler = vi.fn((request: AnyTestRequest) => {
    switch (request._tag) {
      case 'Get':
        return Effect.succeed({
          domainType: request.domainType,
          url: request.url,
          name: `from:${tag}`,
        } as Resource.WithResourceUrl<TestResources[keyof TestResources]>)
      case 'Search':
        return Effect.succeed([
          {
            domainType: request.domainType,
            url: originUrl.appendToPathname(`/${String(request.domainType)}/s`),
            name: `from:${tag}`,
          },
        ] as ReadonlyArray<
          Resource.WithResourceUrl<TestResources[keyof TestResources]>
        >)
      case 'Create':
        return Effect.succeed({
          ...request.resource,
          url: originUrl.appendToPathname(`/${String(request.domainType)}/new`),
        } as Resource.WithResourceUrl<TestResources[keyof TestResources]>)
      case 'Update':
        return Effect.succeed(request.resource)
      case 'Delete':
        return Effect.succeed(null)
    }
  })
  return {
    handler,
    resolver: RequestResolver.fromEffect(
      handler
    ) as ResourceRequest.MultiResolver<
      TestResources,
      keyof TestResources,
      never
    >,
    requestGenerators: {
      Get: () => {
        const req = Request.of<ResourceRequest.Get<TestResource>>()({
          _tag: 'Get',
          domainType: 'TestResource',
          url: originUrl.appendToPathname('/TestResource/1'),
          origin: originUrl,
        })
        return req
      },
      Search: () => {
        const req = Request.of<ResourceRequest.Search<TR>>()({
          _tag: 'Search',
          domainType: 'TestResource',
          params: {},
          origin: originUrl,
        })
        return req
      },
      SearchAll: () => {
        const req = Request.of<ResourceRequest.Search<TR>>()({
          _tag: 'Search',
          domainType: 'TestResource',
          params: {},
          origin: null,
        })
        return req
      },
      Create: () => {
        const req = Request.of<ResourceRequest.Create<TR>>()({
          _tag: 'Create',
          domainType: 'TestResource',
          resource: { domainType: 'TestResource', name: 'new' },
          origin: originUrl,
        })
        return req
      },
      Update: () => {
        const req = Request.of<ResourceRequest.Update<TR>>()({
          _tag: 'Update',
          domainType: 'TestResource',
          resource: {
            domainType: 'TestResource',
            url: originUrl.appendToPathname('/TestResource/1'),
            name: 'x',
          },
          origin: originUrl,
        })
        return req
      },
      Delete: () => {
        const req = Request.of<ResourceRequest.Delete<TR>>()({
          _tag: 'Delete',
          domainType: 'TestResource',
          resource: { url: originUrl.appendToPathname('/TestResource/1') },
          origin: originUrl,
        })
        return req
      },
    },
  }
}

// --- Arbitraries & helpers ---

type RequestTag = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

const originUrlArb: fc.Arbitrary<ReadonlyUrl> = fc
  .integer({ min: 0, max: 9999 })
  .map((id) =>
    ReadonlyUrl.make({
      protocol: 'https:',
      host: 'example.com',
      pathname: `/origin-${id}`,
    })
  )

const requestTagArb: fc.Arbitrary<RequestTag> = fc.oneof(
  fc.constant('Get' as const),
  fc.constant('Search' as const),
  fc.constant('Create' as const),
  fc.constant('Update' as const),
  fc.constant('Delete' as const)
)

// --- Composite arbitraries ---

const arbitraryEmptyHubEffect: fc.Arbitrary<
  Effect.Effect<Hub<TestResources>, never, never>
> = fc.constant(makeHub<TestResources>(testResourcesMap))

const arbitraryReadyOrigin = <
  ActiveResources extends keyof TestResources = keyof TestResources,
>({
  originUrl,
  activeResources,
}: {
  originUrl?: fc.Arbitrary<ReadonlyUrl>
  activeResources?: { [K in ActiveResources]: true } & {
    [K in keyof TestResources]?: boolean
  }
} = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  handler: ReturnType<typeof vi.fn>
  origin: ReadyOrigin<TestResources, ActiveResources>
  requestGenerators: {
    Get: () => ResourceRequest.Get<TestResource>
    Search: () => ResourceRequest.Search<TestResource>
    SearchAll: () => ResourceRequest.Search<TestResource>
    Create: () => ResourceRequest.Create<TestResource>
    Update: () => ResourceRequest.Update<TestResource>
    Delete: () => ResourceRequest.Delete<TestResource>
  }
}> =>
  (originUrl ?? originUrlArb).map((url) => {
    const { handler, resolver, requestGenerators } = makeTrackedResolver(url)
    return {
      url,
      handler,
      origin: {
        originUrl: url,
        activeResources: activeResources ?? {
          TestResource: true,
          OtherResource: true,
        },
        resolver,
        errorStatus: undefined,
        provokeReauthenticate: noopProvoke,
        provokeReauthorize: noopProvoke,
      },
      requestGenerators,
    }
  })

const arbitraryNotReadyOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: NotReadyOrigin<TestResources, keyof TestResources>
  error: AuthError | AuthzError | Loading<{ originUrl: ReadonlyUrl }>
  requestGenerators: {
    Get: () => ResourceRequest.Get<TestResource>
    Search: () => ResourceRequest.Search<TestResource>
    SearchAll: () => ResourceRequest.Search<TestResource>
    Create: () => ResourceRequest.Create<TestResource>
    Update: () => ResourceRequest.Update<TestResource>
    Delete: () => ResourceRequest.Delete<TestResource>
  }
}> =>
  (originUrl ?? originUrlArb)
    .chain((originUrl) =>
      fc.tuple(
        fc.constant(originUrl),
        fc.oneof(
          AuthError.arbitrary(fc),
          AuthzError.arbitrary(fc),
          fc.constant(new Loading({ entity: { originUrl } }))
        )
      )
    )
    .map(([url, error]) => {
      const { requestGenerators } = makeTrackedResolver(url) // to ensure url is in the correct format, even though the resolver won't be used
      return {
        url,
        origin: {
          originUrl: url,
          activeResources: { TestResource: true, OtherResource: true },
          resolver: undefined,
          errorStatus: error,
          provokeReauthenticate: noopProvoke,
          provokeReauthorize: noopProvoke,
        },
        error,
        requestGenerators,
      }
    })

const arbitraryHubWithAllReadyOriginsEffect = fc
  .tuple(
    arbitraryEmptyHubEffect,
    fc.uniqueArray(arbitraryReadyOrigin(), {
      minLength: 1,
      maxLength: 4,
      selector: (o) => o.url.toString(),
    })
  )
  .map(([emptyHubEffect, readyOrigins]) =>
    Effect.gen(function* () {
      const hub = yield* emptyHubEffect
      yield* Effect.all(readyOrigins.map((o) => hub.setOriginState(o.origin)))
      return { hub, origins: readyOrigins }
    })
  )

const arbitraryHubWithSomeErrorOriginsEffect = fc
  .tuple(
    arbitraryEmptyHubEffect,
    fc.uniqueArray(arbitraryReadyOrigin(), {
      minLength: 1,
      maxLength: 3,
      selector: (o) => o.url.toString(),
    }),
    fc.uniqueArray(arbitraryNotReadyOrigin(), {
      minLength: 1,
      maxLength: 3,
      selector: (o) => o.url.toString(),
    })
  )
  .filter(([_hubEffect, ready, notReady]) => {
    const readyUrls = new Set(ready.map((o) => o.url.toString()))
    return notReady.every((o) => !readyUrls.has(o.url.toString()))
  })
  .map(([emptyHubEffect, readyOrigins, errorOrigins]) =>
    Effect.gen(function* () {
      const hub = yield* emptyHubEffect
      yield* Effect.all([
        ...readyOrigins.map((o) => hub.setOriginState(o.origin)),
        ...errorOrigins.map((o) => hub.setOriginState(o.origin)),
      ])
      return { hub, readyOrigins, errorOrigins }
    })
  )

const sendRequest = (
  hub: Hub<TestResources>,
  origin: ReadonlyUrl,
  tag: RequestTag
) => {
  const url = origin.appendToPathname('/TestResource/1')
  switch (tag) {
    case 'Get':
      return Effect.request(
        Request.of<ResourceRequest.Get<TR>>()({
          _tag: 'Get',
          domainType: 'TestResource',
          url,
          origin,
        }),
        hub.resolver
      ).pipe(Effect.asVoid)
    case 'Search':
      return Effect.request(
        Request.of<ResourceRequest.Search<TR>>()({
          _tag: 'Search',
          domainType: 'TestResource',
          params: {},
          origin,
        }),
        hub.resolver
      ).pipe(Effect.asVoid)
    case 'Create':
      return Effect.request(
        Request.of<ResourceRequest.Create<TR>>()({
          _tag: 'Create',
          domainType: 'TestResource',
          resource: { domainType: 'TestResource', name: 'new' },
          origin,
        }),
        hub.resolver
      ).pipe(Effect.asVoid)
    case 'Update':
      return Effect.request(
        Request.of<ResourceRequest.Update<TR>>()({
          _tag: 'Update',
          domainType: 'TestResource',
          resource: { domainType: 'TestResource', url, name: 'x' },
          origin,
        }),
        hub.resolver
      ).pipe(Effect.asVoid)
    case 'Delete':
      return Effect.request(
        Request.of<ResourceRequest.Delete<TR>>()({
          _tag: 'Delete',
          domainType: 'TestResource',
          resource: { url },
          origin,
        }),
        hub.resolver
      ).pipe(Effect.asVoid)
  }
}

const squashFailure = <A, E>(exit: Exit.Exit<A, E>): E => {
  if (Exit.isFailure(exit)) return Cause.squash(exit.cause) as E
  assert.fail('Expected a failure exit')
}

// --- Tests ---

describe('Hub', () => {
  describe('routing', () => {
    it.effect.prop(
      'requests route only to the targeted origin',
      {
        arbitraryHubWithAllReadyOriginsEffect,
        targetIndex: fc.nat({ max: 99 }),
        requestTags: fc.array(requestTagArb, { minLength: 1, maxLength: 6 }),
      },
      ({
        arbitraryHubWithAllReadyOriginsEffect,
        targetIndex: rawTarget,
        requestTags,
      }) =>
        Effect.gen(function* () {
          const { hub, origins } = yield* arbitraryHubWithAllReadyOriginsEffect
          const target = rawTarget % origins.length

          for (const tag of requestTags) {
            yield* Effect.request(
              origins[target].requestGenerators[tag](),
              hub.resolver
            ).pipe(Effect.asVoid)
          }

          expect(origins[target].handler).toHaveBeenCalledTimes(
            requestTags.length
          )
          Array.remove(origins, target).forEach((o) =>
            expect(o.handler).not.toHaveBeenCalled()
          )
        })
    )
  })

  describe('fan-out search', () => {
    it.effect.prop(
      'null-origin search calls every ready origin and returns the union of results',
      { arbitraryHubWithAllReadyOriginsEffect },
      ({ arbitraryHubWithAllReadyOriginsEffect }) =>
        Effect.gen(function* () {
          const { hub, origins } = yield* arbitraryHubWithAllReadyOriginsEffect

          const results = yield* Effect.request(
            Request.of<ResourceRequest.Search<TR>>()({
              _tag: 'Search',
              domainType: 'TestResource',
              params: {},
              origin: null,
            }),
            hub.resolver
          )

          expect(results).toHaveLength(origins.length)
          origins.forEach((o) =>
            expect(o.handler).toHaveBeenCalledWith(
              expect.objectContaining({ _tag: 'Search' })
            )
          )
        })
    )
  })

  describe('not-ready origins', () => {
    it.effect.prop(
      'requests to a not-ready origin fail with the corresponding error kind',
      {
        notReady: arbitraryNotReadyOrigin(),
        requestTag: requestTagArb,
      },
      ({ notReady, requestTag }) =>
        Effect.gen(function* () {
          const hub = yield* makeHub<TestResources>(testResourcesMap)
          yield* hub.setOriginState(notReady.origin)

          const exit = yield* Effect.request(
            notReady.requestGenerators[requestTag](),
            hub.resolver
          )
            .pipe(Effect.asVoid)
            .pipe(Effect.exit)
          const actualErrorTag = notReady.error._tag
          if (actualErrorTag === 'Loading') {
            // Loading is an implementation detail of the Hub, not a failure mode of requests, so we expect UnhandledError instead
            expect(squashFailure(exit)._tag).toBe('UnhandledError')
          } else {
            expect(squashFailure(exit)._tag).toBe(notReady.error._tag)
          }
        })
    )

    it.effect.prop(
      'fan-out search fails when any origin is not ready',
      { hubContext: arbitraryHubWithSomeErrorOriginsEffect },
      ({ hubContext }) =>
        Effect.gen(function* () {
          const { hub } = yield* hubContext

          const exit = yield* Effect.request(
            Request.of<ResourceRequest.Search<TR>>()({
              _tag: 'Search',
              domainType: 'TestResource',
              params: {},
              origin: null,
            }),
            hub.resolver
          ).pipe(Effect.exit)

          expect(Exit.isFailure(exit)).toBe(true)
        })
    )
  })

  describe('unknown origins', () => {
    it.effect.prop(
      'requests to unregistered origins fail with UnhandledError',
      {
        arbitraryEmptyHubEffect,
        origin: originUrlArb,
      },
      ({ arbitraryEmptyHubEffect, origin }) =>
        Effect.gen(function* () {
          const hub = yield* arbitraryEmptyHubEffect

          const exit = yield* Effect.request(
            Request.of<ResourceRequest.Search<TR>>()({
              _tag: 'Search',
              domainType: 'TestResource',
              params: {},
              origin,
            }),
            hub.resolver
          ).pipe(Effect.exit)
          expect(squashFailure(exit)._tag).toBe('UnhandledError')
        })
    )
  })

  describe('domain type filtering', () => {
    it.effect.prop(
      'requests for a resource type the origin does not support fail with UnhandledError',
      {
        arbitraryEmptyHubEffect,
        readyOrigin: arbitraryReadyOrigin<'OtherResource'>({
          activeResources: { OtherResource: true, TestResource: false },
        }),
        requestTag: requestTagArb,
      },
      ({ arbitraryEmptyHubEffect, readyOrigin, requestTag }) =>
        Effect.gen(function* () {
          const hub = yield* arbitraryEmptyHubEffect
          const { handler, origin, requestGenerators } = readyOrigin //makeTrackedResolver(origin)

          yield* hub.setOriginState<'OtherResource'>(origin)

          const exit = yield* Effect.request(
            requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid, Effect.exit)
          expect(squashFailure(exit)._tag).toBe('UnhandledError')
          expect(handler).not.toHaveBeenCalled()
        })
    )

    it.effect.prop(
      'fan-out search fails when no origins support the requested resource type',
      { origin: originUrlArb },
      ({ origin }) =>
        Effect.gen(function* () {
          const hub = yield* makeHub<TestResources>(testResourcesMap)
          const { handler, resolver, requestGenerators } =
            makeTrackedResolver(origin)

          yield* hub.setOriginState<'OtherResource'>({
            originUrl: origin,
            activeResources: { OtherResource: true },
            resolver,
            errorStatus: undefined,
            provokeReauthenticate: noopProvoke,
            provokeReauthorize: noopProvoke,
          })

          const exit = yield* Effect.request(
            requestGenerators.SearchAll(),
            hub.resolver
          ).pipe(Effect.exit)

          expect(Exit.isFailure(exit)).toBe(true)
          expect(handler).not.toHaveBeenCalled()
        })
    )
  })

  describe('origin lifecycle', () => {
    it.effect.prop(
      'setOriginState makes the origin reachable; deregisterOrigin removes it',
      {
        arbitraryEmptyHubEffect,
        ready: arbitraryReadyOrigin(),
        requestTag: requestTagArb,
      },
      ({ arbitraryEmptyHubEffect, ready, requestTag }) =>
        Effect.gen(function* () {
          const hub = yield* arbitraryEmptyHubEffect
          yield* hub.setOriginState(ready.origin)
          yield* Effect.request(
            ready.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)

          yield* hub.deregisterOrigin(ready.url)
          const exit = yield* Effect.request(
            ready.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.exit)
          expect(squashFailure(exit)._tag).toBe('UnhandledError')
        })
    )

    const twinnedReadyOrigins = () =>
      originUrlArb.chain((baseUrl) => {
        const baseUrlArb = fc.constant(baseUrl)
        return fc.record({
          origin: baseUrlArb,
          firstOrigin: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
          }),
          secondOrigin: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
          }),
        })
      })

    it.effect.prop(
      'setOriginState replaces the previous resolver — only the latest is called',
      {
        arbitraryEmptyHubEffect,
        twinnedReadyOrigins: twinnedReadyOrigins(),
        requestTag: requestTagArb,
      },
      ({
        arbitraryEmptyHubEffect,
        twinnedReadyOrigins: { origin, firstOrigin, secondOrigin },
        requestTag,
      }) =>
        Effect.gen(function* () {
          const hub = yield* arbitraryEmptyHubEffect

          yield* hub.setOriginState(firstOrigin.origin)
          yield* hub.setOriginState(secondOrigin.origin)
          yield* Effect.request(
            secondOrigin.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)

          expect(firstOrigin.handler).not.toHaveBeenCalled()
          expect(secondOrigin.handler).toHaveBeenCalledOnce()
        })
    )

    const twinnedReadyAndNotReadyOrigins = () =>
      originUrlArb.chain((baseUrl) => {
        const baseUrlArb = fc.constant(baseUrl)
        return fc.record({
          origin: baseUrlArb,
          ready: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
          }),
          notReady: arbitraryNotReadyOrigin({
            originUrl: baseUrlArb,
          }),
        })
      })

    it.effect.prop(
      'recovery: any error state can be resolved by setting a ready origin',
      {
        arbitraryEmptyHubEffect,
        origins: twinnedReadyAndNotReadyOrigins(),
        requestTag: requestTagArb,
      },
      ({ arbitraryEmptyHubEffect, origins: { ready, notReady }, requestTag }) =>
        Effect.gen(function* () {
          const hub = yield* arbitraryEmptyHubEffect
          yield* hub.setOriginState(notReady.origin)
          const failExit = yield* Effect.request(
            notReady.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid, Effect.exit)
          expect(Exit.isFailure(failExit)).toBe(true)

          yield* hub.setOriginState(ready.origin)
          yield* Effect.request(
            notReady.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)
          expect(ready.handler).toHaveBeenCalledOnce()
        })
    )
  })
})
