import { describe, expect, it, vi } from 'vitest'
import {
  Chunk,
  Effect,
  Either,
  Logger,
  LogLevel,
  Option,
  Schema,
  Stream,
} from 'effect'

import {
  ReadonlyUrl,
  Resource,
  UriEncodedOriginUrl,
  type OriginState,
  type ReadyOrigin,
} from '@assessmentis/effectful-store'
import { AuthError, Loading, UnhandledError } from '@assessmentis/ontology'

import type { BaseOriginDefinition } from '../models/BaseOriginDefinition'
import type { OrgSlug } from '../models/IdTypes'
import type { Org } from '../models/Org'
import { UserOrg } from '../models/UserOrg'
import { hubStateStream } from './HubStateUpdater'

const decodeUserOrg = Schema.decodeUnknownSync(UserOrg)

type TestResources = { Patient: Resource.Resource<'Patient'> }

const encode = (url: string): UriEncodedOriginUrl =>
  UriEncodedOriginUrl.make(encodeURIComponent(url))

const makeDefinition = (
  tag: string,
  extra?: Record<string, unknown>
): BaseOriginDefinition =>
  ({
    _tag: tag,
    activeResources: { Patient: true as const },
    ...extra,
  }) as BaseOriginDefinition

const makeOrg = (origins: Record<string, BaseOriginDefinition>): Org =>
  ({
    slug: 'test-org' as OrgSlug,
    emoji: '🏥',
    origins: Object.fromEntries(
      Object.entries(origins).map(([url, def]) => [encode(url), def])
    ),
    originConfigs: {},
  }) as unknown as Org

const right = <A>(a: A) => Either.right(a)

const makeInput = (org: Org, userOrg?: UserOrg) =>
  right({ org, userOrg: userOrg ?? undefined })

const collectAll = <A, R>(stream: Stream.Stream<A, never, R>) =>
  stream.pipe(Stream.runCollect, Effect.map(Chunk.toReadonlyArray))

describe('hubStateStream', () => {
  it('calls originMaker and emits state for matching tags', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://example.com')),
      activeResources: { Patient: true as const },
      resolver: {} as ReadyOrigin<TestResources, 'Patient'>['resolver'],
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } satisfies OriginState<TestResources, 'Patient'>

    const maker = vi.fn(
      (
        _def: BaseOriginDefinition,
        _cred: Record<string, unknown> | undefined
      ) => Effect.succeed(originState)
    )

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 'test_origin', make: maker }],
          Stream.make(
            makeInput(
              makeOrg({ 'https://example.com': makeDefinition('test_origin') })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][0]._tag).toBe('test_origin')
    expect(emissions).toHaveLength(1)
    const state = Either.getOrThrow(emissions[0]!)
    expect(state.get('https://example.com/')).toBe(originState)
  })

  it('emits error origin state for unrecognized tags', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [],
          Stream.make(
            makeInput(
              makeOrg({
                'https://example.com': makeDefinition('unknown_type'),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(1)
    const state = Either.getOrThrow(emissions[0]!)
    const origin = state.get('https://example.com/')
    expect(origin).toBeDefined()
    expect(origin!.resolver).toBeUndefined()
    expect(origin!.errorStatus).toBeInstanceOf(UnhandledError)
  })

  it('removes origin from state when it is removed from org', async () => {
    const makeOriginForUrl = (url: string) => ({
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      activeResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    })

    const originTypes = [
      {
        tag: 'ta',
        make: () =>
          Effect.succeed(
            makeOriginForUrl('https://a.com') as unknown as OriginState<
              TestResources,
              never
            >
          ),
      },
      {
        tag: 'tb',
        make: () =>
          Effect.succeed(
            makeOriginForUrl('https://b.com') as unknown as OriginState<
              TestResources,
              never
            >
          ),
      },
    ]

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          originTypes,
          Stream.make(
            makeInput(
              makeOrg({
                'https://a.com': makeDefinition('ta'),
                'https://b.com': makeDefinition('tb'),
              })
            ),
            makeInput(makeOrg({ 'https://a.com': makeDefinition('ta') }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    const state0 = Either.getOrThrow(emissions[0]!)
    const state1 = Either.getOrThrow(emissions[1]!)
    expect(state0.has('https://a.com/')).toBe(true)
    expect(state0.has('https://b.com/')).toBe(true)
    expect(state1.has('https://b.com/')).toBe(false)
    expect(state1.has('https://a.com/')).toBe(true)
  })

  it('logs when an origin is deregistered', async () => {
    const logs: Array<string> = []
    const testLogger = Logger.make(({ message }) => {
      logs.push(String(message))
    })

    const makeOriginForUrl = (url: string) => ({
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      activeResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    })

    const originTypes = [
      {
        tag: 'ta',
        make: () =>
          Effect.succeed(
            makeOriginForUrl('https://a.com') as unknown as OriginState<
              TestResources,
              never
            >
          ),
      },
      {
        tag: 'tb',
        make: () =>
          Effect.succeed(
            makeOriginForUrl('https://b.com') as unknown as OriginState<
              TestResources,
              never
            >
          ),
      },
    ]

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          originTypes,
          Stream.make(
            makeInput(
              makeOrg({
                'https://a.com': makeDefinition('ta'),
                'https://b.com': makeDefinition('tb'),
              })
            ),
            makeInput(makeOrg({ 'https://a.com': makeDefinition('ta') }))
          )
        )
      ).pipe(
        Effect.scoped,
        Logger.withMinimumLogLevel(LogLevel.All),
        Effect.provide(Logger.replace(Logger.defaultLogger, testLogger))
      )
    )

    expect(logs.some((msg) => msg.includes('Origin deregistered'))).toBe(true)
    expect(logs.some((msg) => msg.includes('https://b.com/'))).toBe(true)
  })

  it('caches origin state when definition is unchanged', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      activeResources: { Patient: true as const },
      resolver: undefined as unknown as ReadyOrigin<
        TestResources,
        never
      >['resolver'],
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } satisfies OriginState<TestResources, never>

    const maker = vi.fn(() => Effect.succeed(originState))

    const org = makeOrg({ 'https://a.com': makeDefinition('t') })

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 't', make: maker }],
          Stream.make(makeInput(org), makeInput(org))
        )
      ).pipe(Effect.scoped)
    )

    // Cached: maker is called once, second emission reuses the state
    expect(maker).toHaveBeenCalledOnce()
    expect(emissions).toHaveLength(2)
    const state0 = Either.getOrThrow(emissions[0]!)
    const state1 = Either.getOrThrow(emissions[1]!)
    expect(state0.get('https://a.com/')).toBe(state1.get('https://a.com/'))
  })

  it('re-registers when definition changes', async () => {
    const maker = vi.fn((def: BaseOriginDefinition) =>
      Effect.succeed({
        originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
        activeResources: def.activeResources,
        resolver: undefined,
        errorStatus: undefined,
        provokeReauthenticate: () => Effect.void,
        provokeReauthorize: () => Effect.void,
      })
    ) as unknown as (
      def: BaseOriginDefinition,
      cred: Record<string, unknown> | undefined
    ) => Effect.Effect<OriginState<TestResources, never>>

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 't', make: maker }],
          Stream.make(
            makeInput(
              makeOrg({
                'https://a.com': makeDefinition('t', { extra: 'v1' }),
              })
            ),
            makeInput(
              makeOrg({
                'https://a.com': makeDefinition('t', { extra: 'v2' }),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledTimes(2)
  })

  it('passes through Left errors', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [],
          Stream.make(
            makeInput(makeOrg({})),
            Either.left(new UnhandledError({ message: 'org failed' }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    expect(Either.isRight(emissions[0]!)).toBe(true)
    expect(Either.isLeft(emissions[1]!)).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[1]!))
    expect(error).toBeInstanceOf(UnhandledError)
  })

  it('passes through Left(Loading)', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [],
          Stream.make(
            makeInput(makeOrg({})),
            Either.left(new Loading({ entity: { orgSlug: 'test' as OrgSlug } }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    expect(Either.isRight(emissions[0]!)).toBe(true)
    expect(Either.isLeft(emissions[1]!)).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[1]!))
    expect(error).toBeInstanceOf(Loading)
  })

  it('passes through Left(AuthError)', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 't', make: vi.fn() }],
          Stream.make(Either.left(AuthError.Unauthenticated))
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(1)
    expect(Either.isLeft(emissions[0]!)).toBe(true)
  })

  it('rebuilds origin when credential identity changes', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      activeResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } as unknown as OriginState<TestResources, never>

    const maker = vi.fn(() => Effect.succeed(originState))

    const org = makeOrg({ 'https://a.com': makeDefinition('t') })
    const encodedUrl = encode('https://a.com')

    const userOrg1 = decodeUserOrg({
      originConfig: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'a@example.com',
        },
      },
    })
    const userOrg2 = decodeUserOrg({
      originConfig: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'b@example.com',
        },
      },
    })

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 't', make: maker }],
          Stream.make(makeInput(org, userOrg1), makeInput(org, userOrg2))
        )
      ).pipe(Effect.scoped)
    )

    // Email changed, so maker should be called twice
    expect(maker).toHaveBeenCalledTimes(2)
  })

  it('passes credential context to maker', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      activeResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } as unknown as OriginState<TestResources, never>

    const maker = vi.fn(
      (
        _def: BaseOriginDefinition,
        _cred: Record<string, unknown> | undefined
      ) => Effect.succeed(originState)
    )

    const org = makeOrg({ 'https://a.com': makeDefinition('t') })
    const encodedUrl = encode('https://a.com')
    const userOrg = decodeUserOrg({
      originConfig: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'user@example.com',
        },
      },
    })

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never>(
          [{ tag: 't', make: maker }],
          Stream.make(makeInput(org, userOrg))
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][1]).toEqual({
      _tag: 'google_user_oauth_token',
      email: 'user@example.com',
    })
  })
})
