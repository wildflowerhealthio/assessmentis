import { assert, describe, expect, vi } from 'vitest'
import { it } from '@effect/vitest'
import {
  Array,
  Cause,
  Chunk,
  Deferred,
  Effect,
  Either,
  Exit,
  FastCheck as fc,
  Fiber,
  HashMap,
  Request,
  RequestResolver,
  Stream,
  SubscriptionRef,
} from 'effect'

import { AuthError, AuthzError, NotFoundError } from '@assessmentis/ontology'

import { makeHubFromRef } from './Hub'
import type { HubError, HubState } from './Hub'
import type * as Origin from './Origin'
import { ReadonlyUrl } from './ReadonlyUrl'
import * as Resource from './Resource'
import type * as ResourceRequest from './ResourceRequest'

// --- Resource types ---

class TestResource {
  static readonly DomainType = 'TestResource' as const
  static readonly UrlSchema = ReadonlyUrl.FromString
  readonly domainType = 'TestResource' as const
  readonly url?: ReadonlyUrl | undefined
  readonly name!: string
}

class OtherResource {
  static readonly DomainType = 'OtherResource' as const
  static readonly UrlSchema = ReadonlyUrl.FromString
  readonly domainType = 'OtherResource' as const
  readonly url?: ReadonlyUrl | undefined
  readonly value!: number
}

type TestClasses = typeof TestResource | typeof OtherResource

// --- Mutable hub test harness ---

const makeMutableHub = <Classes extends Resource.AnyDomainClass>() =>
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make<
      Either.Either<HubState, HubError>
    >(Either.right(HashMap.empty()))
    const hub = makeHubFromRef<Classes>(stateRef)

    const setOriginState = <SupportedClasses extends Classes>(
      origin: Origin.AnyState<SupportedClasses>
    ): Effect.Effect<void> =>
      SubscriptionRef.update(stateRef, (current) => {
        const state = Either.isRight(current)
          ? current.right
          : HashMap.empty<string, Origin.AnyState<never>>()
        return Either.right(
          HashMap.set(state, origin.originUrl.toString(), origin)
        )
      })

    const deregisterOrigin = (originUrl: ReadonlyUrl): Effect.Effect<void> =>
      SubscriptionRef.update(stateRef, (current) => {
        const state = Either.isRight(current)
          ? current.right
          : HashMap.empty<string, Origin.AnyState<never>>()
        return Either.right(HashMap.remove(state, originUrl.toString()))
      })

    const setHubError = (error: HubError): Effect.Effect<void> =>
      SubscriptionRef.set(stateRef, Either.left(error))

    return { hub, setOriginState, setHubError, deregisterOrigin }
  })

// --- Builders ---

const noopProvoke = () => Effect.void

type AnyTestRequest = Origin.AnyResourceRequest<
  typeof TestResource | typeof OtherResource
>

/** Verified mock: embeds provenance (origin tag) in responses so tests can
 *  assert which resolver produced a result. */
const makeTrackedResolver = (originUrl: ReadonlyUrl) => {
  const tag = originUrl.toString()
  const handler = vi.fn((request: AnyTestRequest) => {
    switch (request._tag) {
      case 'Get':
        return Effect.succeed({
          domainType: request.klass.DomainType,
          url: request.url,
          name: `from:${tag}`,
        } as Resource.WithResourceUrl<TestResource | OtherResource>)
      case 'Search':
        return Effect.succeed([
          {
            domainType: request.klass.DomainType,
            url: originUrl.appendToPathname(
              `/${String(request.klass.DomainType)}/s`
            ),
            name: `from:${tag}`,
          },
        ] as ReadonlyArray<
          Resource.WithResourceUrl<TestResource | OtherResource>
        >)
      case 'Create':
        return Effect.succeed({
          ...request.resource,
          url: originUrl.appendToPathname(
            `/${String(request.klass.DomainType)}/new`
          ),
        } as Resource.WithResourceUrl<TestResource | OtherResource>)
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
    ) as ResourceRequest.MultiResolver<TestClasses, never>,
    requestGenerators: {
      Get: () => {
        const req = Request.of<ResourceRequest.Get<typeof TestResource>>()({
          _tag: 'Get',
          klass: TestResource,
          url: originUrl.appendToPathname('/TestResource/1'),
          origin: originUrl,
        })
        return req
      },
      Search: () => {
        const req = Request.of<ResourceRequest.Search<typeof TestResource>>()({
          _tag: 'Search',
          klass: TestResource,
          params: {},
          origin: originUrl,
        })
        return req
      },
      SearchAll: () => {
        const req = Request.of<ResourceRequest.Search<typeof TestResource>>()({
          _tag: 'Search',
          klass: TestResource,
          params: {},
          origin: null,
        })
        return req
      },
      Create: () => {
        const req = Request.of<ResourceRequest.Create<typeof TestResource>>()({
          _tag: 'Create',
          klass: TestResource,
          resource: { domainType: 'TestResource', name: 'new' },
          origin: originUrl,
        })
        return req
      },
      Update: () => {
        const req = Request.of<ResourceRequest.Update<typeof TestResource>>()({
          _tag: 'Update',
          klass: TestResource,
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
        const req = Request.of<ResourceRequest.Delete<typeof TestResource>>()({
          _tag: 'Delete',
          klass: TestResource,
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

const arbitraryEmptyMutableHubEffect =
  fc.constant(makeMutableHub<TestClasses>())

const arbitraryReadyOrigin = <
  SupportedClasses extends TestClasses = TestClasses,
>({
  originUrl,
  supportedResources,
}: {
  originUrl?: fc.Arbitrary<ReadonlyUrl>
  supportedResources: {
    readonly [Klass in SupportedClasses as Klass['DomainType']]: Klass
  } & {
    readonly [K: string]: Resource.AnyDomainClass
  }
}): fc.Arbitrary<{
  url: ReadonlyUrl
  handler: ReturnType<typeof vi.fn>
  origin: Origin.Ready<SupportedClasses>
  requestGenerators: {
    Get: () => ResourceRequest.Get<typeof TestResource>
    Search: () => ResourceRequest.Search<typeof TestResource>
    SearchAll: () => ResourceRequest.Search<typeof TestResource>
    Create: () => ResourceRequest.Create<typeof TestResource>
    Update: () => ResourceRequest.Update<typeof TestResource>
    Delete: () => ResourceRequest.Delete<typeof TestResource>
  }
}> =>
  (originUrl ?? originUrlArb).map((url) => {
    const { handler, resolver, requestGenerators } = makeTrackedResolver(url)
    return {
      url,
      handler,
      origin: {
        originUrl: url,
        supportedResources,
        resolver,
        errorStatus: undefined,
        provokeReauthenticate: noopProvoke,
        provokeReauthorize: noopProvoke,
      },
      requestGenerators,
    }
  })

/** Origin with a permanent error (AuthError or AuthzError). */
const arbitraryPermanentErrorOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: Origin.Errored<TestClasses>
  error: AuthError | AuthzError
  requestGenerators: ReturnType<typeof makeTrackedResolver>['requestGenerators']
}> =>
  (originUrl ?? originUrlArb)
    .chain((originUrl) =>
      fc.tuple(
        fc.constant(originUrl),
        fc.oneof(AuthError.arbitrary(fc), AuthzError.arbitrary(fc))
      )
    )
    .map(([url, error]) => {
      const { requestGenerators } = makeTrackedResolver(url)
      return {
        url,
        origin: {
          originUrl: url,
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          } as any,
          resolver: undefined,
          errorStatus: error,
          provokeReauthenticate: noopProvoke,
          provokeReauthorize: noopProvoke,
        },
        error,
        requestGenerators,
      }
    })

/** An origin in Loading state (both resolver and errorStatus are undefined). */
const arbitraryLoadingOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: Origin.Loading<TestClasses>
  requestGenerators: ReturnType<typeof makeTrackedResolver>['requestGenerators']
}> =>
  (originUrl ?? originUrlArb).map((url) => {
    const { requestGenerators } = makeTrackedResolver(url)
    return {
      url,
      origin: {
        originUrl: url,
        supportedResources: {
          TestResource: TestResource,
          OtherResource: OtherResource,
        },
        resolver: undefined,
        errorStatus: undefined,
        provokeReauthenticate: noopProvoke,
        provokeReauthorize: noopProvoke,
      },
      requestGenerators,
    }
  })

const arbitraryHubWithAllReadyOriginsEffect = fc
  .tuple(
    arbitraryEmptyMutableHubEffect,
    fc.uniqueArray(
      arbitraryReadyOrigin({
        supportedResources: {
          TestResource: TestResource,
          OtherResource: OtherResource,
        },
      }),
      {
        minLength: 1,
        maxLength: 4,
        selector: (o) => o.url.toString(),
      }
    )
  )
  .map(([emptyHubEffect, readyOrigins]) =>
    Effect.gen(function* () {
      const { hub, setOriginState } = yield* emptyHubEffect
      yield* Effect.all(readyOrigins.map((o) => setOriginState(o.origin)))
      return { hub, setOriginState, origins: readyOrigins }
    })
  )

const arbitraryHubWithSomePermanentErrorOriginsEffect = fc
  .tuple(
    arbitraryEmptyMutableHubEffect,
    fc.uniqueArray(
      arbitraryReadyOrigin({
        supportedResources: {
          TestResource: TestResource,
          OtherResource: OtherResource,
        },
      }),
      {
        minLength: 1,
        maxLength: 3,
        selector: (o) => o.url.toString(),
      }
    ),
    fc.uniqueArray(arbitraryPermanentErrorOrigin(), {
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
      const { hub, setOriginState } = yield* emptyHubEffect
      yield* Effect.all([
        ...readyOrigins.map((o) => setOriginState(o.origin)),
        ...errorOrigins.map((o) => setOriginState(o.origin)),
      ])
      return { hub, setOriginState, readyOrigins, errorOrigins }
    })
  )

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
            Request.of<ResourceRequest.Search<typeof TestResource>>()({
              _tag: 'Search',
              klass: TestResource,
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

  describe('permanently errored origins', () => {
    it.effect.prop(
      'requests to a permanently errored origin fail with the corresponding error kind',
      {
        errored: arbitraryPermanentErrorOrigin(),
        requestTag: requestTagArb,
      },
      ({ errored, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(errored.origin)

          const exit = yield* Effect.request(
            errored.requestGenerators[requestTag](),
            hub.resolver
          )
            .pipe(Effect.asVoid)
            .pipe(Effect.exit)
          expect(squashFailure(exit)._tag).toBe(errored.error._tag)
        })
    )

    it.effect.prop(
      'fan-out search fails when any origin has a permanent error',
      { hubContext: arbitraryHubWithSomePermanentErrorOriginsEffect },
      ({ hubContext }) =>
        Effect.gen(function* () {
          const { hub } = yield* hubContext

          const exit = yield* Effect.request(
            Request.of<ResourceRequest.Search<typeof TestResource>>()({
              _tag: 'Search',
              klass: TestResource,
              params: {},
              origin: null,
            }),
            hub.resolver
          ).pipe(Effect.exit)

          expect(Exit.isFailure(exit)).toBe(true)
        })
    )
  })

  describe('Loading origins', () => {
    it.effect.prop(
      'requests to a Loading origin succeed when origin becomes ready',
      {
        loading: arbitraryLoadingOrigin(),
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        requestTag: requestTagArb,
      },
      ({ loading, ready, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          // Use the same URL for loading and ready origins
          const readyAtSameUrl: typeof ready.origin = {
            ...ready.origin,
            originUrl: loading.url,
          }
          yield* setOriginState(loading.origin)

          // Fork the request — it will wait for the origin to become ready
          const fiber = yield* Effect.request(
            loading.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid, Effect.fork)

          // Transition the origin from Loading to Ready
          yield* setOriginState(readyAtSameUrl)

          // The forked request should now complete successfully
          yield* Fiber.join(fiber)
          expect(ready.handler).toHaveBeenCalledOnce()
        })
    )

    it.effect.prop(
      'requests to a Loading origin fail when origin settles to a permanent error',
      {
        loading: arbitraryLoadingOrigin(),
        permanentError: fc.oneof(
          AuthError.arbitrary(fc),
          AuthzError.arbitrary(fc)
        ),
        requestTag: requestTagArb,
      },
      ({ loading, permanentError, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(loading.origin)

          const fiber = yield* Effect.request(
            loading.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid, Effect.exit, Effect.fork)

          // Transition Loading → permanent error
          yield* setOriginState({
            ...loading.origin,
            errorStatus: permanentError,
          })

          const exit = yield* Fiber.join(fiber)
          expect(squashFailure(exit)._tag).toBe(permanentError._tag)
        })
    )

    it.effect.prop(
      'fan-out search waits for Loading origins and succeeds when they become ready',
      {
        loading: arbitraryLoadingOrigin(),
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ loading, ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          const readyAtSameUrl: typeof ready.origin = {
            ...ready.origin,
            originUrl: loading.url,
          }
          yield* setOriginState(loading.origin)

          const fiber = yield* Effect.request(
            Request.of<ResourceRequest.Search<typeof TestResource>>()({
              _tag: 'Search',
              klass: TestResource,
              params: {},
              origin: null,
            }),
            hub.resolver
          ).pipe(Effect.fork)

          yield* setOriginState(readyAtSameUrl)

          const results = yield* Fiber.join(fiber)
          expect(results.length).toBeGreaterThan(0)
          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Search' })
          )
        })
    )
  })

  describe('unknown origins', () => {
    it.effect.prop(
      'requests to unregistered origins fail with UnhandledError',
      {
        arbitraryEmptyMutableHubEffect,
        origin: originUrlArb,
      },
      ({ arbitraryEmptyMutableHubEffect, origin }) =>
        Effect.gen(function* () {
          const { hub } = yield* arbitraryEmptyMutableHubEffect

          const exit = yield* Effect.request(
            Request.of<ResourceRequest.Search<typeof TestResource>>()({
              _tag: 'Search',
              klass: TestResource,
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
        arbitraryEmptyMutableHubEffect,
        readyOrigin: arbitraryReadyOrigin<typeof OtherResource>({
          supportedResources: {
            OtherResource: OtherResource,
          },
        }),
        requestTag: requestTagArb,
      },
      ({ arbitraryEmptyMutableHubEffect, readyOrigin, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          const { handler, origin, requestGenerators } = readyOrigin

          yield* setOriginState(origin)

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
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          const { handler, resolver, requestGenerators } =
            makeTrackedResolver(origin)

          yield* setOriginState<typeof OtherResource>({
            originUrl: origin,
            supportedResources: {
              OtherResource: OtherResource,
            },
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
        arbitraryEmptyMutableHubEffect,
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        requestTag: requestTagArb,
      },
      ({ arbitraryEmptyMutableHubEffect, ready, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState, deregisterOrigin } =
            yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(ready.origin)
          yield* Effect.request(
            ready.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)

          yield* deregisterOrigin(ready.url)
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
            supportedResources: {
              TestResource: TestResource,
              OtherResource: OtherResource,
            },
          }),
          secondOrigin: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
            supportedResources: {
              TestResource: TestResource,
              OtherResource: OtherResource,
            },
          }),
        })
      })

    it.effect.prop(
      'setOriginState replaces the previous resolver — only the latest is called',
      {
        arbitraryEmptyMutableHubEffect,
        twinnedReadyOrigins: twinnedReadyOrigins(),
        requestTag: requestTagArb,
      },
      ({
        arbitraryEmptyMutableHubEffect,
        twinnedReadyOrigins: { firstOrigin, secondOrigin },
        requestTag,
      }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect

          yield* setOriginState(firstOrigin.origin)
          yield* setOriginState(secondOrigin.origin)
          yield* Effect.request(
            secondOrigin.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)

          expect(firstOrigin.handler).not.toHaveBeenCalled()
          expect(secondOrigin.handler).toHaveBeenCalledOnce()
        })
    )

    const twinnedReadyAndErrorOrigins = () =>
      originUrlArb.chain((baseUrl) => {
        const baseUrlArb = fc.constant(baseUrl)
        return fc.record({
          origin: baseUrlArb,
          ready: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
            supportedResources: {
              TestResource: TestResource,
              OtherResource: OtherResource,
            },
          }),
          errored: arbitraryPermanentErrorOrigin({
            originUrl: baseUrlArb,
          }),
        })
      })

    it.effect.prop(
      'recovery: a permanent error state can be resolved by setting a ready origin',
      {
        arbitraryEmptyMutableHubEffect,
        origins: twinnedReadyAndErrorOrigins(),
        requestTag: requestTagArb,
      },
      ({
        arbitraryEmptyMutableHubEffect,
        origins: { ready, errored },
        requestTag,
      }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(errored.origin)
          const failExit = yield* Effect.request(
            errored.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid, Effect.exit)
          expect(Exit.isFailure(failExit)).toBe(true)

          yield* setOriginState(ready.origin)
          yield* Effect.request(
            errored.requestGenerators[requestTag](),
            hub.resolver
          ).pipe(Effect.asVoid)
          expect(ready.handler).toHaveBeenCalledOnce()
        })
    )
  })

  describe('subscribe', () => {
    it.effect.prop(
      'emits the resource when origin is ready',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        arbitraryEmptyMutableHubEffect,
      },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const results = yield* hub
            .subscribe(TestResource, url)
            .pipe(Stream.take(1), Stream.runCollect)

          const items = Chunk.toReadonlyArray(results)
          expect(items).toHaveLength(1)
          expect(Either.isRight(items[0]!)).toBe(true)
        })
    )

    it.effect.prop(
      'emits Left when no origin matches, then Right when origin becomes available',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        arbitraryEmptyMutableHubEffect,
      },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          const url = ready.url.appendToPathname('/TestResource/1')

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribe(TestResource, url).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch) // ensure subscription is active
          yield* setOriginState(ready.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(Either.isLeft(results[0]!)).toBe(true)
          expect(Either.isRight(results[1]!)).toBe(true)
        })
    )

    it.effect.prop(
      're-emits when the matching origin is replaced',
      {
        arbitraryEmptyMutableHubEffect,
        origins: originUrlArb.chain((baseUrl) =>
          fc.record({
            first: arbitraryReadyOrigin({
              originUrl: fc.constant(baseUrl),
              supportedResources: {
                TestResource: TestResource,
                OtherResource: OtherResource,
              },
            }),
            second: arbitraryReadyOrigin({
              originUrl: fc.constant(baseUrl),
              supportedResources: {
                TestResource: TestResource,
                OtherResource: OtherResource,
              },
            }),
          })
        ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { first, second } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(first.origin)

          const resourceUrl = first.url.appendToPathname('/TestResource/1')
          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribe(TestResource, resourceUrl).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch)
          yield* setOriginState(second.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(results.every(Either.isRight)).toBe(true)
        })
    )

    it.effect.prop(
      'does not re-emit when an unrelated origin changes',
      {
        arbitraryEmptyMutableHubEffect,
        origins: fc
          .record({
            target: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                    OtherResource: OtherResource,
                  },
                }),
                second: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                    OtherResource: OtherResource,
                  },
                }),
              })
            ),
            unrelated: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                    OtherResource: OtherResource,
                  },
                }),
                second: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                    OtherResource: OtherResource,
                  },
                }),
              })
            ),
          })
          .filter(
            ({ target, unrelated }) =>
              !target.first.url.hasChild(unrelated.first.url) &&
              !unrelated.first.url.hasChild(target.first.url)
          ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { target, unrelated } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(target.first.origin)
          yield* setOriginState(unrelated.first.origin)

          const resourceUrl =
            target.first.url.appendToPathname('/TestResource/1')
          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribe(TestResource, resourceUrl).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch)
          // Change unrelated origin (should NOT trigger emission)
          yield* setOriginState(unrelated.second.origin)
          // Change target origin (SHOULD trigger emission, completing take(2))
          yield* setOriginState(target.second.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(results.every(Either.isRight)).toBe(true)
          // Second emission used the replacement target resolver
          expect(target.second.handler).toHaveBeenCalledTimes(1)
        })
    )
  })

  describe('subscribeSearch', () => {
    it.effect.prop(
      'emits search results when origins are ready',
      { arbitraryHubWithAllReadyOriginsEffect },
      ({ arbitraryHubWithAllReadyOriginsEffect }) =>
        Effect.gen(function* () {
          const { hub, origins } = yield* arbitraryHubWithAllReadyOriginsEffect

          const results = yield* hub
            .subscribeSearch(TestResource)
            .pipe(Stream.take(1), Stream.runCollect)

          const items = Chunk.toReadonlyArray(results)
          expect(items).toHaveLength(1)
          expect(Either.isRight(items[0]!)).toBe(true)
          expect(Either.getOrThrow(items[0]!)).toHaveLength(origins.length)
        })
    )

    it.effect.prop(
      'emits Left when no origins exist, then Right when one is registered',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        arbitraryEmptyMutableHubEffect,
      },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribeSearch(TestResource).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch)
          yield* setOriginState(ready.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(Either.isLeft(results[0]!)).toBe(true)
          expect(Either.isRight(results[1]!)).toBe(true)
        })
    )

    it.effect.prop(
      're-emits when a relevant origin is replaced',
      {
        arbitraryEmptyMutableHubEffect,
        origins: originUrlArb.chain((baseUrl) =>
          fc.record({
            first: arbitraryReadyOrigin({
              originUrl: fc.constant(baseUrl),
              supportedResources: {
                TestResource: TestResource,
                OtherResource: OtherResource,
              },
            }),
            second: arbitraryReadyOrigin({
              originUrl: fc.constant(baseUrl),
              supportedResources: {
                TestResource: TestResource,
                OtherResource: OtherResource,
              },
            }),
          })
        ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { first, second } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(first.origin)

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribeSearch(TestResource).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch)
          yield* setOriginState(second.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(results.every(Either.isRight)).toBe(true)
        })
    )

    it.effect.prop(
      'does not re-emit when an origin with unrelated resource types changes',
      {
        arbitraryEmptyMutableHubEffect,
        origins: fc
          .record({
            testOnly: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin<typeof TestResource>({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                  },
                }),
                second: arbitraryReadyOrigin<typeof TestResource>({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    TestResource: TestResource,
                  },
                }),
              })
            ),
            otherOnly: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin<typeof OtherResource>({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    OtherResource: OtherResource,
                  },
                }),
                second: arbitraryReadyOrigin<typeof OtherResource>({
                  originUrl: fc.constant(baseUrl),
                  supportedResources: {
                    OtherResource: OtherResource,
                  },
                }),
              })
            ),
          })
          .filter(
            ({ testOnly, otherOnly }) =>
              testOnly.first.url.toString() !== otherOnly.first.url.toString()
          ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { testOnly, otherOnly } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(testOnly.first.origin)
          yield* setOriginState(otherOnly.first.origin)

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribeSearch(TestResource).pipe(
            Stream.tap(() => Deferred.succeed(latch, void 0)),
            Stream.take(2),
            Stream.runCollect,
            Effect.fork
          )

          yield* Deferred.await(latch)
          // Change OtherResource-only origin (should NOT trigger re-emit)
          yield* setOriginState(otherOnly.second.origin)
          // Change TestResource origin (SHOULD trigger re-emit, completing take(2))
          yield* setOriginState(testOnly.second.origin)

          const results = Chunk.toReadonlyArray(yield* Fiber.join(fiber))
          expect(results).toHaveLength(2)
          expect(results.every(Either.isRight)).toBe(true)
          // Second emission used the replacement TestResource resolver
          expect(testOnly.second.handler).toHaveBeenCalledTimes(1)
        })
    )
  })

  describe('HubRepository', () => {
    it.effect.prop(
      'get infers origin from URL and returns the resource',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
        arbitraryEmptyMutableHubEffect,
      },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const result = yield* hub.get(TestResource, url)

          expect(result.url).toEqual(url)
          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Get', url })
          )
        })
    )

    it.effect.prop(
      'get fails with NotFoundError when no origin matches the URL',
      { origin: originUrlArb, arbitraryEmptyMutableHubEffect },
      ({ origin, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub } = yield* arbitraryEmptyMutableHubEffect
          const unregisteredUrl = origin.appendToPathname('/TestResource/1')

          const exit = yield* hub
            .get(TestResource, unregisteredUrl)
            .pipe(Effect.exit)

          expect(squashFailure(exit)).toBeInstanceOf(NotFoundError)
        })
    )

    it.effect.prop(
      'get fails with UnhandledError when multiple origins match the URL',
      {
        origin: originUrlArb,
        arbitraryEmptyMutableHubEffect,
      },
      ({ origin, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          const { resolver: resolver1 } = makeTrackedResolver(origin)
          const { resolver: resolver2 } = makeTrackedResolver(origin)

          // Register two origins where one is a parent of the other
          const childOrigin = origin.appendToPathname('/sub')
          yield* setOriginState({
            originUrl: origin,
            supportedResources: {
              TestResource: TestResource,
              OtherResource: OtherResource,
            },
            resolver: resolver1,
            errorStatus: undefined,
            provokeReauthenticate: noopProvoke,
            provokeReauthorize: noopProvoke,
          })
          yield* setOriginState({
            originUrl: childOrigin,
            supportedResources: {
              TestResource: TestResource,
              OtherResource: OtherResource,
            },
            resolver: resolver2,
            errorStatus: undefined,
            provokeReauthenticate: noopProvoke,
            provokeReauthorize: noopProvoke,
          })

          const ambiguousUrl = childOrigin.appendToPathname('/TestResource/1')
          const exit = yield* hub
            .get(TestResource, ambiguousUrl)
            .pipe(Effect.exit)

          expect(squashFailure(exit)._tag).toBe('UnhandledError')
        })
    )

    it.effect.prop(
      'getMany fans out search to all origins',
      { arbitraryHubWithAllReadyOriginsEffect },
      ({ arbitraryHubWithAllReadyOriginsEffect }) =>
        Effect.gen(function* () {
          const { hub, origins } = yield* arbitraryHubWithAllReadyOriginsEffect

          const results = yield* hub.search(TestResource)

          expect(results).toHaveLength(origins.length)
          origins.forEach((o) =>
            expect(o.handler).toHaveBeenCalledWith(
              expect.objectContaining({ _tag: 'Search' })
            )
          )
        })
    )

    it.effect.prop(
      'create with explicit origin routes to that origin',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(ready.origin)

          const result = yield* hub.create(
            TestResource,
            { domainType: 'TestResource', name: 'new' },
            ready.url
          )

          expect(result.url).toBeDefined()
          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({
              _tag: 'Create',
              origin: ready.url,
            })
          )
        })
    )

    it.effect.prop(
      'create without origin infers the single matching origin',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(ready.origin)

          const result = yield* hub.create(TestResource, {
            domainType: 'TestResource',
            name: 'new',
          })

          expect(result.url).toBeDefined()
          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Create' })
          )
        })
    )

    it.effect(
      'create without origin fails with UnhandledError when no origins exist',
      () =>
        Effect.gen(function* () {
          const { hub } = yield* makeMutableHub<TestClasses>()

          const exit = yield* hub
            .create(TestResource, {
              domainType: 'TestResource',
              name: 'new',
            })
            .pipe(Effect.exit)

          expect(squashFailure(exit)._tag).toBe('UnhandledError')
        })
    )

    it.effect.prop(
      'createMany creates multiple resources in one batch',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(ready.origin)

          const results = yield* hub.createMany(
            TestResource,
            [
              { domainType: 'TestResource', name: 'a' },
              { domainType: 'TestResource', name: 'b' },
            ],
            ready.url
          )

          expect(results).toHaveLength(2)
          expect(ready.handler).toHaveBeenCalledTimes(2)
        })
    )

    it.effect.prop(
      'update infers origin from resource URL',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const result = yield* hub.update(TestResource, {
            domainType: 'TestResource',
            url,
            name: 'updated',
          })

          expect(result.url).toEqual(url)
          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Update' })
          )
        })
    )

    it.effect.prop(
      'delete infers origin from URL',
      {
        ready: arbitraryReadyOrigin({
          supportedResources: {
            TestResource: TestResource,
            OtherResource: OtherResource,
          },
        }),
      },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestClasses>()
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          yield* hub.delete(TestResource, url)

          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Delete' })
          )
        })
    )
  })
})
