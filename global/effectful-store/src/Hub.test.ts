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

import {
  AuthError,
  AuthzError,
  Loading,
  NotFoundError,
} from '@assessmentis/ontology'

import { makeHubFromRef, type HubError, type HubState } from './Hub'
import type {
  AnyResourceRequest,
  NotReadyOrigin,
  OriginState,
  ReadyOrigin,
} from './OriginState'
import { ReadonlyUrl } from './ReadonlyUrl'
import type * as Resource from './Resource'
import type * as ResourceRequest from './ResourceRequest'

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

// --- Mutable hub test harness ---

const makeMutableHub = <
  Resources extends Record<string, Resource.Resource<string>>,
>() =>
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make<
      Either.Either<HubState<Resources>, HubError>
    >(Either.right(HashMap.empty()))
    const hub = makeHubFromRef(stateRef)

    const setOriginState = <ActiveResources extends keyof Resources>(
      origin: OriginState<Resources, ActiveResources>
    ): Effect.Effect<void> =>
      SubscriptionRef.update(stateRef, (current) => {
        const state = Either.isRight(current)
          ? current.right
          : HashMap.empty<string, OriginState<Resources, never>>()
        return Either.right(
          HashMap.set(state, origin.originUrl.toString(), origin)
        )
      })

    const deregisterOrigin = (originUrl: ReadonlyUrl): Effect.Effect<void> =>
      SubscriptionRef.update(stateRef, (current) => {
        const state = Either.isRight(current)
          ? current.right
          : HashMap.empty<string, OriginState<Resources, never>>()
        return Either.right(HashMap.remove(state, originUrl.toString()))
      })

    const setHubError = (error: HubError): Effect.Effect<void> =>
      SubscriptionRef.set(stateRef, Either.left(error))

    return { hub, setOriginState, setHubError, deregisterOrigin }
  })

// --- Builders ---

const noopProvoke = () => Effect.void

type AnyTestRequest = AnyResourceRequest<TestResources[keyof TestResources]>

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

const arbitraryEmptyMutableHubEffect =
  fc.constant(makeMutableHub<TestResources>())

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

/** Not-ready origin with any error type (Auth, Authz, or Loading). */
const arbitraryNotReadyOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: NotReadyOrigin<TestResources, keyof TestResources>
  error: AuthError | AuthzError | Loading<{ originUrl: ReadonlyUrl }>
  requestGenerators: ReturnType<typeof makeTrackedResolver>['requestGenerators']
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
      const { requestGenerators } = makeTrackedResolver(url)
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

/** Not-ready origin with only permanent errors (AuthError, AuthzError). */
const arbitraryPermanentErrorOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: NotReadyOrigin<TestResources, keyof TestResources>
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

/** An origin in Loading state. */
const arbitraryLoadingOrigin = ({
  originUrl,
}: { originUrl?: fc.Arbitrary<ReadonlyUrl> } = {}): fc.Arbitrary<{
  url: ReadonlyUrl
  origin: NotReadyOrigin<TestResources, keyof TestResources>
  requestGenerators: ReturnType<typeof makeTrackedResolver>['requestGenerators']
}> =>
  (originUrl ?? originUrlArb).map((url) => {
    const { requestGenerators } = makeTrackedResolver(url)
    return {
      url,
      origin: {
        originUrl: url,
        activeResources: { TestResource: true, OtherResource: true },
        resolver: undefined,
        errorStatus: new Loading({ entity: { originUrl: url } }),
        provokeReauthenticate: noopProvoke,
        provokeReauthorize: noopProvoke,
      },
      requestGenerators,
    }
  })

const arbitraryHubWithAllReadyOriginsEffect = fc
  .tuple(
    arbitraryEmptyMutableHubEffect,
    fc.uniqueArray(arbitraryReadyOrigin(), {
      minLength: 1,
      maxLength: 4,
      selector: (o) => o.url.toString(),
    })
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
    fc.uniqueArray(arbitraryReadyOrigin(), {
      minLength: 1,
      maxLength: 3,
      selector: (o) => o.url.toString(),
    }),
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

  describe('permanently errored origins', () => {
    it.effect.prop(
      'requests to a permanently errored origin fail with the corresponding error kind',
      {
        errored: arbitraryPermanentErrorOrigin(),
        requestTag: requestTagArb,
      },
      ({ errored, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
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

  describe('Loading origins', () => {
    it.effect.prop(
      'requests to a Loading origin succeed when origin becomes ready',
      {
        loading: arbitraryLoadingOrigin(),
        ready: arbitraryReadyOrigin(),
        requestTag: requestTagArb,
      },
      ({ loading, ready, requestTag }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
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
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
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
        ready: arbitraryReadyOrigin(),
      },
      ({ loading, ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          const readyAtSameUrl: typeof ready.origin = {
            ...ready.origin,
            originUrl: loading.url,
          }
          yield* setOriginState(loading.origin)

          const fiber = yield* Effect.request(
            Request.of<ResourceRequest.Search<TR>>()({
              _tag: 'Search',
              domainType: 'TestResource',
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
        arbitraryEmptyMutableHubEffect,
        readyOrigin: arbitraryReadyOrigin<'OtherResource'>({
          activeResources: { OtherResource: true, TestResource: false },
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
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          const { handler, resolver, requestGenerators } =
            makeTrackedResolver(origin)

          yield* setOriginState({
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
        arbitraryEmptyMutableHubEffect,
        ready: arbitraryReadyOrigin(),
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
          }),
          secondOrigin: arbitraryReadyOrigin({
            originUrl: baseUrlArb,
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
      { ready: arbitraryReadyOrigin(), arbitraryEmptyMutableHubEffect },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const results = yield* hub
            .subscribe('TestResource', url)
            .pipe(Stream.take(1), Stream.runCollect)

          const items = Chunk.toReadonlyArray(results)
          expect(items).toHaveLength(1)
          expect(Either.isRight(items[0]!)).toBe(true)
        })
    )

    it.effect.prop(
      'emits Left when no origin matches, then Right when origin becomes available',
      { ready: arbitraryReadyOrigin(), arbitraryEmptyMutableHubEffect },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          const url = ready.url.appendToPathname('/TestResource/1')

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribe('TestResource', url).pipe(
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
            first: arbitraryReadyOrigin({ originUrl: fc.constant(baseUrl) }),
            second: arbitraryReadyOrigin({ originUrl: fc.constant(baseUrl) }),
          })
        ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { first, second } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(first.origin)

          const resourceUrl = first.url.appendToPathname('/TestResource/1')
          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribe('TestResource', resourceUrl).pipe(
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
                }),
                second: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                }),
              })
            ),
            unrelated: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
                }),
                second: arbitraryReadyOrigin({
                  originUrl: fc.constant(baseUrl),
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
          const fiber = yield* hub.subscribe('TestResource', resourceUrl).pipe(
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
            .subscribeSearch('TestResource')
            .pipe(Stream.take(1), Stream.runCollect)

          const items = Chunk.toReadonlyArray(results)
          expect(items).toHaveLength(1)
          expect(Either.isRight(items[0]!)).toBe(true)
          expect(Either.getOrThrow(items[0]!)).toHaveLength(origins.length)
        })
    )

    it.effect.prop(
      'emits Left when no origins exist, then Right when one is registered',
      { ready: arbitraryReadyOrigin(), arbitraryEmptyMutableHubEffect },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribeSearch('TestResource').pipe(
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
            first: arbitraryReadyOrigin({ originUrl: fc.constant(baseUrl) }),
            second: arbitraryReadyOrigin({ originUrl: fc.constant(baseUrl) }),
          })
        ),
      },
      ({ arbitraryEmptyMutableHubEffect, origins: { first, second } }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(first.origin)

          const latch = yield* Deferred.make<void>()
          const fiber = yield* hub.subscribeSearch('TestResource').pipe(
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
                first: arbitraryReadyOrigin<'TestResource'>({
                  originUrl: fc.constant(baseUrl),
                  activeResources: {
                    TestResource: true,
                    OtherResource: false,
                  },
                }),
                second: arbitraryReadyOrigin<'TestResource'>({
                  originUrl: fc.constant(baseUrl),
                  activeResources: {
                    TestResource: true,
                    OtherResource: false,
                  },
                }),
              })
            ),
            otherOnly: originUrlArb.chain((baseUrl) =>
              fc.record({
                first: arbitraryReadyOrigin<'OtherResource'>({
                  originUrl: fc.constant(baseUrl),
                  activeResources: {
                    OtherResource: true,
                    TestResource: false,
                  },
                }),
                second: arbitraryReadyOrigin<'OtherResource'>({
                  originUrl: fc.constant(baseUrl),
                  activeResources: {
                    OtherResource: true,
                    TestResource: false,
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
          const fiber = yield* hub.subscribeSearch('TestResource').pipe(
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
      { ready: arbitraryReadyOrigin(), arbitraryEmptyMutableHubEffect },
      ({ ready, arbitraryEmptyMutableHubEffect }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* arbitraryEmptyMutableHubEffect
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const result = yield* hub.get('TestResource', url)

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
            .get('TestResource', unregisteredUrl)
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
            activeResources: { TestResource: true, OtherResource: true },
            resolver: resolver1,
            errorStatus: undefined,
            provokeReauthenticate: noopProvoke,
            provokeReauthorize: noopProvoke,
          })
          yield* setOriginState({
            originUrl: childOrigin,
            activeResources: { TestResource: true, OtherResource: true },
            resolver: resolver2,
            errorStatus: undefined,
            provokeReauthenticate: noopProvoke,
            provokeReauthorize: noopProvoke,
          })

          const ambiguousUrl = childOrigin.appendToPathname('/TestResource/1')
          const exit = yield* hub
            .get('TestResource', ambiguousUrl)
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

          const results = yield* hub.search('TestResource')

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
      { ready: arbitraryReadyOrigin() },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          yield* setOriginState(ready.origin)

          const result = yield* hub.create(
            'TestResource',
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
      { ready: arbitraryReadyOrigin() },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          yield* setOriginState(ready.origin)

          const result = yield* hub.create('TestResource', {
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
          const { hub } = yield* makeMutableHub<TestResources>()

          const exit = yield* hub
            .create('TestResource', {
              domainType: 'TestResource',
              name: 'new',
            })
            .pipe(Effect.exit)

          expect(squashFailure(exit)._tag).toBe('UnhandledError')
        })
    )

    it.effect.prop(
      'createMany creates multiple resources in one batch',
      { ready: arbitraryReadyOrigin() },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          yield* setOriginState(ready.origin)

          const results = yield* hub.createMany(
            'TestResource',
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
      { ready: arbitraryReadyOrigin() },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          const result = yield* hub.update('TestResource', {
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
      { ready: arbitraryReadyOrigin() },
      ({ ready }) =>
        Effect.gen(function* () {
          const { hub, setOriginState } = yield* makeMutableHub<TestResources>()
          yield* setOriginState(ready.origin)

          const url = ready.url.appendToPathname('/TestResource/1')
          yield* hub.delete('TestResource', url)

          expect(ready.handler).toHaveBeenCalledWith(
            expect.objectContaining({ _tag: 'Delete' })
          )
        })
    )
  })
})
