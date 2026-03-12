import { describe, expect, it, vi } from 'vitest'
import {
  Chunk,
  Effect,
  Either,
  HashMap,
  Logger,
  LogLevel,
  Option,
  Stream,
} from 'effect'

import { UnhandledError } from '@assessmentis/ontology'

import { ReadonlyUrl, UriEncodedOriginUrl } from './ReadonlyUrl'
import type * as Origin from './Origin'
import type * as Resource from './Resource'
import {
  hubStateStream,
  type OriginConfig,
  type OriginSourceSnapshot,
} from './HubStateStream'

type TestResources = { Patient: Resource.Resource<'Patient'> }

const encode = (url: string): UriEncodedOriginUrl =>
  UriEncodedOriginUrl.make(encodeURIComponent(url))

const makeDefinition = (
  tag: string,
  extra?: Record<string, unknown>
): OriginConfig => ({
  _tag: tag,
  supportedResources: { Patient: true as const },
  ...extra,
})

const makeSnapshot = (
  origins: Record<string, OriginConfig>,
  originConfigs?: Record<string, Record<string, unknown>>
): OriginSourceSnapshot => ({
  origins: Object.fromEntries(
    Object.entries(origins).map(([url, def]) => [encode(url), def])
  ),
  originConfigs: originConfigs
    ? Object.fromEntries(
        Object.entries(originConfigs).map(([url, cfg]) => [encode(url), cfg])
      )
    : undefined,
})

const right = <A>(a: A) => Either.right(a)

const collectAll = <A, R>(stream: Stream.Stream<A, never, R>) =>
  stream.pipe(Stream.runCollect, Effect.map(Chunk.toReadonlyArray))

describe('hubStateStream', () => {
  it('calls origin factory and emits state for matching tags', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://example.com')),
      supportedResources: { Patient: true as const },
      resolver: {} as Origin.Ready<TestResources, 'Patient'>['resolver'],
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } satisfies Origin.AnyState<TestResources, 'Patient'>

    const maker = vi.fn(
      (
        _originUrl: ReadonlyUrl,
        _def: OriginConfig,
        _cred: Record<string, unknown> | undefined
      ) => Effect.succeed(originState)
    )

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 'test_origin', make: maker }],
          Stream.make(
            right(
              makeSnapshot({
                'https://example.com': makeDefinition('test_origin'),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][1]._tag).toBe('test_origin')
    expect(emissions).toHaveLength(1)
    const state = Either.getOrThrow(emissions[0]!)
    expect(Option.getOrThrow(HashMap.get(state, 'https://example.com/'))).toBe(
      originState
    )
  })

  it('emits error origin state for unrecognized tags', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [],
          Stream.make(
            right(
              makeSnapshot({
                'https://example.com': makeDefinition('unknown_type'),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(1)
    const state = Either.getOrThrow(emissions[0]!)
    const origin = Option.getOrThrow(HashMap.get(state, 'https://example.com/'))
    expect(origin.resolver).toBeUndefined()
    expect(origin.errorStatus).toBeInstanceOf(UnhandledError)
  })

  it('removes origin from state when it is removed from snapshot', async () => {
    const makeOriginForUrl = (url: string) => ({
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      supportedResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    })

    const originFactories = [
      {
        tag: 'ta',
        make: (_originUrl: ReadonlyUrl) =>
          Effect.succeed(
            makeOriginForUrl('https://a.com') as unknown as Origin.AnyState<
              TestResources,
              never
            >
          ),
      },
      {
        tag: 'tb',
        make: (_originUrl: ReadonlyUrl) =>
          Effect.succeed(
            makeOriginForUrl('https://b.com') as unknown as Origin.AnyState<
              TestResources,
              never
            >
          ),
      },
    ]

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          originFactories,
          Stream.make(
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('ta'),
                'https://b.com': makeDefinition('tb'),
              })
            ),
            right(makeSnapshot({ 'https://a.com': makeDefinition('ta') }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    const state0 = Either.getOrThrow(emissions[0]!)
    const state1 = Either.getOrThrow(emissions[1]!)
    expect(HashMap.has(state0, 'https://a.com/')).toBe(true)
    expect(HashMap.has(state0, 'https://b.com/')).toBe(true)
    expect(HashMap.has(state1, 'https://b.com/')).toBe(false)
    expect(HashMap.has(state1, 'https://a.com/')).toBe(true)
  })

  it('logs when an origin is deregistered', async () => {
    const logs: Array<string> = []
    const testLogger = Logger.make(({ message }) => {
      logs.push(String(message))
    })

    const makeOriginForUrl = (url: string) => ({
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      supportedResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    })

    const originFactories = [
      {
        tag: 'ta',
        make: (_originUrl: ReadonlyUrl) =>
          Effect.succeed(
            makeOriginForUrl('https://a.com') as unknown as Origin.AnyState<
              TestResources,
              never
            >
          ),
      },
      {
        tag: 'tb',
        make: (_originUrl: ReadonlyUrl) =>
          Effect.succeed(
            makeOriginForUrl('https://b.com') as unknown as Origin.AnyState<
              TestResources,
              never
            >
          ),
      },
    ]

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          originFactories,
          Stream.make(
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('ta'),
                'https://b.com': makeDefinition('tb'),
              })
            ),
            right(makeSnapshot({ 'https://a.com': makeDefinition('ta') }))
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

  it('caches origin state when definition is structurally equal', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      supportedResources: { Patient: true as const },
      resolver: undefined as unknown as Origin.Ready<
        TestResources,
        never
      >['resolver'],
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } satisfies Origin.AnyState<TestResources, never>

    const maker = vi.fn((_originUrl: ReadonlyUrl) =>
      Effect.succeed(originState)
    )

    // Create two structurally equal but referentially different snapshots
    const snap1 = makeSnapshot({ 'https://a.com': makeDefinition('t') })
    const snap2 = makeSnapshot({ 'https://a.com': makeDefinition('t') })

    // Verify they are referentially different
    expect(snap1).not.toBe(snap2)

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 't', make: maker }],
          Stream.make(right(snap1), right(snap2))
        )
      ).pipe(Effect.scoped)
    )

    // Cached via Equal.equals structural equality: maker called once,
    // second emission reuses the same origin state
    expect(maker).toHaveBeenCalledOnce()
    expect(emissions).toHaveLength(2)
    const state0 = Either.getOrThrow(emissions[0]!)
    const state1 = Either.getOrThrow(emissions[1]!)
    expect(Option.getOrThrow(HashMap.get(state0, 'https://a.com/'))).toBe(
      Option.getOrThrow(HashMap.get(state1, 'https://a.com/'))
    )
  })

  it('re-creates origin when definition changes', async () => {
    const maker = vi.fn((_originUrl: ReadonlyUrl, def: OriginConfig) =>
      Effect.succeed({
        originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
        supportedResources: def.supportedResources,
        resolver: undefined,
        errorStatus: undefined,
        provokeReauthenticate: () => Effect.void,
        provokeReauthorize: () => Effect.void,
      })
    ) as unknown as (
      originUrl: ReadonlyUrl,
      def: OriginConfig,
      cred: Record<string, unknown> | undefined
    ) => Effect.Effect<Origin.AnyState<TestResources, never>>

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 't', make: maker }],
          Stream.make(
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('t', { extra: 'v1' }),
              })
            ),
            right(
              makeSnapshot({
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
        hubStateStream<TestResources, never, UnhandledError>(
          [],
          Stream.make(
            right(makeSnapshot({})),
            Either.left(new UnhandledError({ message: 'source failed' }))
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

  it('rebuilds origin when origin config changes', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      supportedResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } as unknown as Origin.AnyState<TestResources, never>

    const maker = vi.fn((_originUrl: ReadonlyUrl) =>
      Effect.succeed(originState)
    )

    const encodedUrl = encode('https://a.com')

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 't', make: maker }],
          Stream.make(
            right({
              origins: {
                [encodedUrl]: makeDefinition('t'),
              },
              originConfigs: {
                [encodedUrl]: {
                  _tag: 'google_user_oauth_token',
                  email: 'a@example.com',
                },
              },
            }),
            right({
              origins: {
                [encodedUrl]: makeDefinition('t'),
              },
              originConfigs: {
                [encodedUrl]: {
                  _tag: 'google_user_oauth_token',
                  email: 'b@example.com',
                },
              },
            })
          )
        )
      ).pipe(Effect.scoped)
    )

    // Email changed, so maker should be called twice
    expect(maker).toHaveBeenCalledTimes(2)
  })

  it('passes origin config to factory', async () => {
    const originState = {
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      supportedResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } as unknown as Origin.AnyState<TestResources, never>

    const maker = vi.fn(
      (
        _originUrl: ReadonlyUrl,
        _def: OriginConfig,
        _cred: Record<string, unknown> | undefined
      ) => Effect.succeed(originState)
    )

    const encodedUrl = encode('https://a.com')

    await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 't', make: maker }],
          Stream.make(
            right({
              origins: {
                [encodedUrl]: makeDefinition('t'),
              },
              originConfigs: {
                [encodedUrl]: {
                  _tag: 'google_user_oauth_token',
                  email: 'user@example.com',
                },
              },
            })
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][2]).toEqual({
      _tag: 'google_user_oauth_token',
      email: 'user@example.com',
    })
  })

  it('uses consistent urlKey even when maker returns differently-normalized originUrl', async () => {
    // The canonical URL "https://example.com" normalizes to "https://example.com/"
    // (trailing slash added by URL constructor). The maker intentionally returns
    // an origin with a non-trailing-slash pathname to simulate normalization divergence.
    const makerOriginUrl = ReadonlyUrl.make({
      protocol: 'https:',
      host: 'example.com',
      pathname: '', // no trailing slash — toString() would differ from urlKey
    })

    const originState = {
      originUrl: makerOriginUrl,
      supportedResources: { Patient: true as const },
      resolver: undefined,
      errorStatus: undefined,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
    } as unknown as Origin.AnyState<TestResources, never>

    const maker = vi.fn((_originUrl: ReadonlyUrl) =>
      Effect.succeed(originState)
    )

    // Two identical snapshots → first triggers maker, second uses cache
    const snap1 = makeSnapshot({
      'https://example.com': makeDefinition('t'),
    })
    const snap2 = makeSnapshot({
      'https://example.com': makeDefinition('t'),
    })

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<TestResources, never, never>(
          [{ tag: 't', make: maker }],
          Stream.make(right(snap1), right(snap2))
        )
      ).pipe(Effect.scoped)
    )

    // The canonical urlKey is "https://example.com/" (URL-normalized)
    const canonicalKey = 'https://example.com/'

    expect(emissions).toHaveLength(2)

    // Both emissions must use the same canonical key
    const state0 = Either.getOrThrow(emissions[0]!)
    const state1 = Either.getOrThrow(emissions[1]!)
    expect(HashMap.has(state0, canonicalKey)).toBe(true)
    expect(HashMap.has(state1, canonicalKey)).toBe(true)

    // And the origin should be the same reference (cached)
    expect(Option.getOrThrow(HashMap.get(state0, canonicalKey))).toBe(
      Option.getOrThrow(HashMap.get(state1, canonicalKey))
    )

    // Maker called only once (second emission is cached)
    expect(maker).toHaveBeenCalledOnce()

    // Verify the maker received the canonical originUrl as first argument
    const receivedUrl = maker.mock.calls[0][0]
    expect(receivedUrl.toString()).toBe(canonicalKey)
  })
})
