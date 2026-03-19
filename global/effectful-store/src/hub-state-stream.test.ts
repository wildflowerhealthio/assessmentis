import { Chunk, Effect, Either, HashMap, LogLevel, Logger, Option, Scope, Stream } from 'effect'
import { describe, expect, it, vi } from 'vitest'

import { UnhandledError } from '@assessmentis/ontology'
import { deepDataStruct } from '@assessmentis/util'

import type { Resource } from '.'
import { hubStateStream } from './hub-state-stream'
import type { OriginDefinition, OriginFactory, OriginSourceSnapshot } from './hub-state-stream'
import type * as Origin from './origin'
import { ReadonlyUrl, UriEncodedOriginUrl } from './readonly-url'
// --- Resource types ---

class Patient {
  static readonly DomainType = 'Patient' as const
  static readonly UrlSchema = ReadonlyUrl.FromString
  readonly domainType = 'Patient' as const
  readonly url?: ReadonlyUrl | undefined
}

const encode = (url: string): UriEncodedOriginUrl =>
  UriEncodedOriginUrl.make(encodeURIComponent(url))

const makeDefinition = (
  tag: string,
  extra?: Record<string, unknown>
): OriginDefinition<'Patient'> =>
  deepDataStruct({
    ...extra,
    _tag: tag,
    supportedResources: { Patient: true } as const,
  } as any) as OriginDefinition<'Patient'>

const makeSnapshot = (
  origins: Record<string, OriginDefinition<'Patient'>>
): OriginSourceSnapshot => ({
  origins: Object.fromEntries(Object.entries(origins).map(([url, def]) => [encode(url), def])),
})

/**
 * Test-only type alias: `OriginFactory.make` is generic over `Keys`, which
 * makes inline factory objects incompatible without a cast. Using `any` for
 * the class parameter bypasses this in tests where we always use concrete
 * resource types, so the cast does not reduce test confidence.
 */
const asFactory = <SupportedClasses extends Resource.AnyDomainClass, R = never>(f: {
  tag: string
  make: (
    originUrl: ReadonlyUrl,
    config: OriginDefinition<SupportedClasses['DomainType']>
  ) => Effect.Effect<Origin.AnyState<SupportedClasses>, never, R | Scope.Scope>
}): OriginFactory<SupportedClasses, object, R> => f as OriginFactory<SupportedClasses, object, R>

const right = <A>(a: A) => Either.right(a)

const collectAll = <A, R>(stream: Stream.Stream<A, never, R>) =>
  stream.pipe(Stream.runCollect, Effect.map(Chunk.toReadonlyArray))

describe('hubStateStream', () => {
  it('calls origin factory and emits state for matching tags', async () => {
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://example.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: {} as Origin.Ready<typeof Patient>['resolver'],
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl, _def: OriginDefinition<never>) =>
      Effect.succeed(originState)
    )

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<[OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 'test_origin' })],
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
    const state = Either.getOrThrow(emissions[0])
    expect(Option.getOrThrow(HashMap.get(state, 'https://example.com/'))).toBe(originState)
  })

  it('emits error origin state for unrecognized tags', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<[], never, never>(
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
    const state = Either.getOrThrow(emissions[0])
    const origin = Option.getOrThrow(HashMap.get(state, 'https://example.com/'))
    expect(origin.resolver).toBeUndefined()
    expect(origin.errorStatus).toBeInstanceOf(UnhandledError)
  })

  it('removes origin from state when it is removed from snapshot', async () => {
    const makeOriginForUrl = (url: string) => ({
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    })

    const originFactories = [
      asFactory({
        make: (_originUrl: ReadonlyUrl) => Effect.succeed(makeOriginForUrl('https://a.com')),
        tag: 'ta',
      }),
      asFactory({
        make: (_originUrl: ReadonlyUrl) => Effect.succeed(makeOriginForUrl('https://b.com')),
        tag: 'tb',
      }),
    ] as const

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<
          readonly [OriginFactory<typeof Patient, object>, OriginFactory<typeof Patient, object>],
          never,
          never
        >(
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
    const state0 = Either.getOrThrow(emissions[0])
    const state1 = Either.getOrThrow(emissions[1])
    expect(HashMap.has(state0, 'https://a.com/')).toBe(true)
    expect(HashMap.has(state0, 'https://b.com/')).toBe(true)
    expect(HashMap.has(state1, 'https://b.com/')).toBe(false)
    expect(HashMap.has(state1, 'https://a.com/')).toBe(true)
  })

  it('logs when an origin is deregistered', async () => {
    const logs: string[] = []
    const testLogger = Logger.make(({ message }) => {
      logs.push(String(message))
    })

    const makeOriginForUrl = (url: string) => ({
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode(url)),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    })

    const originFactories = [
      asFactory({
        make: (_originUrl: ReadonlyUrl) => Effect.succeed(makeOriginForUrl('https://a.com')),
        tag: 'ta',
      }),
      asFactory({
        make: (_originUrl: ReadonlyUrl) => Effect.succeed(makeOriginForUrl('https://b.com')),
        tag: 'tb',
      }),
    ] as const

    await Effect.runPromise(
      collectAll(
        hubStateStream<
          readonly [OriginFactory<typeof Patient, object>, OriginFactory<typeof Patient, object>],
          never,
          never
        >(
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
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined as unknown as Origin.Ready<typeof Patient>['resolver'],
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl) => Effect.succeed(originState))

    // Create two structurally equal but referentially different snapshots
    const snap1 = makeSnapshot({ 'https://a.com': makeDefinition('t') })
    const snap2 = makeSnapshot({ 'https://a.com': makeDefinition('t') })

    // Verify they are referentially different
    expect(snap1).not.toBe(snap2)

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<[OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 't' })],
          Stream.make(right(snap1), right(snap2))
        )
      ).pipe(Effect.scoped)
    )

    // Cached via Equal.equals structural equality: maker called once,
    // Second emission reuses the same origin state
    expect(maker).toHaveBeenCalledOnce()
    expect(emissions).toHaveLength(2)
    const state0 = Either.getOrThrow(emissions[0])
    const state1 = Either.getOrThrow(emissions[1])
    expect(Option.getOrThrow(HashMap.get(state0, 'https://a.com/'))).toBe(
      Option.getOrThrow(HashMap.get(state1, 'https://a.com/'))
    )
  })

  it('re-creates origin when definition changes', async () => {
    const maker = vi.fn((_originUrl: ReadonlyUrl, _def: OriginDefinition<'Patient'>) =>
      Effect.succeed<Origin.AnyState<typeof Patient>>({
        errorStatus: undefined,
        originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
        provokeReauthenticate: () => Effect.void,
        provokeReauthorize: () => Effect.void,
        resolver: undefined,
        supportedResources: { Patient: Patient },
      })
    )

    await Effect.runPromise(
      collectAll(
        hubStateStream<readonly [OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 't' })] as const,
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
        hubStateStream<[], UnhandledError, never>(
          [],
          Stream.make(
            right(makeSnapshot({})),
            Either.left(new UnhandledError({ message: 'source failed' }))
          )
        ).pipe(Stream.orDie)
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    expect(Either.isRight(emissions[0])).toBe(true)
    expect(Either.isLeft(emissions[1])).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[1]))
    expect(error).toBeInstanceOf(UnhandledError)
  })

  it('rebuilds origin when merged config changes', async () => {
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl) => Effect.succeed(originState))

    await Effect.runPromise(
      collectAll(
        hubStateStream<[OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 't' })] as const,
          Stream.make(
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('t', {
                  email: 'a@example.com',
                }),
              })
            ),
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('t', {
                  email: 'b@example.com',
                }),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    // Email changed, so maker should be called twice
    expect(maker).toHaveBeenCalledTimes(2)
  })

  it('passes merged config to factory', async () => {
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl, _def: OriginDefinition<never>) =>
      Effect.succeed(originState)
    )

    await Effect.runPromise(
      collectAll(
        hubStateStream<readonly [OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 't' })] as const,
          Stream.make(
            right(
              makeSnapshot({
                'https://a.com': makeDefinition('t', {
                  email: 'user@example.com',
                }),
              })
            )
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][1]).toMatchObject({
      email: 'user@example.com',
    })
  })

  it('uses consistent urlKey even when maker returns differently-normalized originUrl', async () => {
    // The canonical URL "https://example.com" normalizes to "https://example.com/"
    // (trailing slash added by URL constructor). The maker intentionally returns
    // An origin with a non-trailing-slash pathname to simulate normalization divergence.
    const makerOriginUrl = ReadonlyUrl.make({
      host: 'example.com',
      pathname: '',
      // No trailing slash — toString() would differ from urlKey
      protocol: 'https:',
    })

    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: makerOriginUrl,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl) => Effect.succeed(originState))

    // Two identical snapshots → first triggers maker, second uses cache
    const snap1 = makeSnapshot({
      'https://example.com': makeDefinition('t'),
    })
    const snap2 = makeSnapshot({
      'https://example.com': makeDefinition('t'),
    })

    const emissions = await Effect.runPromise(
      collectAll(
        hubStateStream<readonly [OriginFactory<typeof Patient, object>], never, never>(
          [asFactory({ make: maker, tag: 't' })] as const,
          Stream.make(right(snap1), right(snap2))
        )
      ).pipe(Effect.scoped)
    )

    // The canonical urlKey is "https://example.com/" (URL-normalized)
    const canonicalKey = 'https://example.com/'

    expect(emissions).toHaveLength(2)

    // Both emissions must use the same canonical key
    const state0 = Either.getOrThrow(emissions[0])
    const state1 = Either.getOrThrow(emissions[1])
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
