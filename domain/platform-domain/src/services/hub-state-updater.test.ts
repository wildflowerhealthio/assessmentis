import { Chunk, Effect, Either, HashMap, Option, Schema, Scope, Stream } from 'effect'
import { describe, expect, it, vi } from 'vitest'

import { ReadonlyUrl, UriEncodedOriginUrl } from '@assessmentis/effectful-store'
import type {
  Origin,
  OriginDefinition,
  OriginFactory,
  Resource,
} from '@assessmentis/effectful-store'
import { AuthError, Loading, UnhandledError } from '@assessmentis/ontology'

import { NoSelectedOrgError } from '../hostedServices/org-service'
import type { BaseOriginDefinition } from '../models/base-origin-definition'
import type { OrgSlug } from '../models/id-types'
import type { Org } from '../models/org'
import { UserOrg } from '../models/user-org'
import { mapOrgStreamToHubState } from './hub-state-updater'

const decodeUserOrg = Schema.decodeUnknownSync(UserOrg)

class Patient {
  static readonly DomainType = 'Patient' as const
  static readonly UrlSchema = ReadonlyUrl.FromString
  readonly domainType = 'Patient' as const
  readonly url?: ReadonlyUrl | undefined
}

const encode = (url: string): UriEncodedOriginUrl =>
  UriEncodedOriginUrl.make(encodeURIComponent(url))

const makeDefinition = (tag: string, extra?: Record<string, unknown>): BaseOriginDefinition =>
  ({
    _tag: tag,
    supportedResources: { Patient: true as const },
    ...extra,
  }) as BaseOriginDefinition

const makeOrg = (origins: Record<string, BaseOriginDefinition>): Org =>
  ({
    emoji: '\u{1F3E5}',
    originServerConfigs: {},
    origins: Object.fromEntries(Object.entries(origins).map(([url, def]) => [encode(url), def])),
    slug: 'test-org' as OrgSlug,
  }) as unknown as Org

const right = <A>(a: A) => Either.right(a)

const makeInput = (org: Org, userOrg?: UserOrg) => right({ org, userOrg: userOrg ?? undefined })

const collectAll = <A, R>(stream: Stream.Stream<A, never, R>) =>
  stream.pipe(Stream.runCollect, Effect.map(Chunk.toReadonlyArray))

/** Test adapter — see HubStateStream.test.ts for rationale. */
const asFactory = <SupportedClasses extends Resource.AnyDomainClass, R = never>(f: {
  tag: string
  make: (
    originUrl: ReadonlyUrl,
    config: OriginDefinition<SupportedClasses['DomainType']>
  ) => Effect.Effect<Origin.AnyState<SupportedClasses>, never, R | Scope.Scope>
}): OriginFactory<SupportedClasses, object, R> => f as OriginFactory<SupportedClasses, object, R>

describe('mapOrgStreamToHubState (platform-domain wrapper)', () => {
  it('maps Org origins to hub state via generic hubStateStream', async () => {
    const originState = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://example.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: {} as Origin.Ready<typeof Patient>['resolver'],
      supportedResources: { Patient: Patient },
    } satisfies Origin.AnyState<typeof Patient>

    const maker = vi.fn((_originUrl: ReadonlyUrl, _def: OriginDefinition<never>) =>
      Effect.succeed(originState)
    )

    const emissions = await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[OriginFactory<typeof Patient, object>]>(
          [asFactory({ make: maker, tag: 'test_origin' })],
          Stream.make(makeInput(makeOrg({ 'https://example.com': makeDefinition('test_origin') })))
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][1]._tag).toBe('test_origin')
    expect(emissions).toHaveLength(1)
    const state = Either.getOrThrow(emissions[0])
    expect(Option.getOrThrow(HashMap.get(state, 'https://example.com/'))).toBe(originState)
  })

  it('merges UserOrg config into origin definition', async () => {
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl, _def: OriginDefinition<'Patient'>) =>
      Effect.succeed(originState)
    )

    const org = makeOrg({ 'https://a.com': makeDefinition('t') })
    const encodedUrl = encode('https://a.com')
    const userOrg = decodeUserOrg({
      originUserConfigs: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'user@example.com',
        },
      },
    })

    await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[OriginFactory<typeof Patient, object>]>(
          [asFactory({ make: maker, tag: 't' })],
          Stream.make(makeInput(org, userOrg))
        )
      ).pipe(Effect.scoped)
    )

    expect(maker).toHaveBeenCalledOnce()
    expect(maker.mock.calls[0][1]).toMatchObject({
      email: 'user@example.com',
    })
  })

  it('passes through Left errors from org stream', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[]>(
          [],
          Stream.make(
            makeInput(makeOrg({})),
            Either.left(new UnhandledError({ message: 'org failed' }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    expect(Either.isRight(emissions[0])).toBe(true)
    expect(Either.isLeft(emissions[1])).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[1]))
    expect(error).toBeInstanceOf(UnhandledError)
  })

  it('passes through Left(Loading)', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[]>(
          [],
          Stream.make(
            makeInput(makeOrg({})),
            Either.left(new Loading({ entity: { orgSlug: 'test' as OrgSlug } }))
          )
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(2)
    expect(Either.isRight(emissions[0])).toBe(true)
    expect(Either.isLeft(emissions[1])).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[1]))
    expect(error).toBeInstanceOf(Loading)
  })

  it('passes through Left(AuthError)', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[OriginFactory<typeof Patient, object>]>(
          [asFactory({ make: vi.fn(), tag: 't' })],
          Stream.make(Either.left(AuthError.Unauthenticated))
        )
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(1)
    expect(Either.isLeft(emissions[0])).toBe(true)
  })

  it('maps NoSelectedOrgError to Loading', async () => {
    const emissions = await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[]>([], Stream.make(Either.left(new NoSelectedOrgError())))
      ).pipe(Effect.scoped)
    )

    expect(emissions).toHaveLength(1)
    expect(Either.isLeft(emissions[0])).toBe(true)
    const error = Option.getOrThrow(Either.getLeft(emissions[0]))
    expect(error).toBeInstanceOf(Loading)
  })

  it('rebuilds origin when UserOrg credential identity changes', async () => {
    const originState: Origin.AnyState<typeof Patient> = {
      errorStatus: undefined,
      originUrl: ReadonlyUrl.fromEncoded(encode('https://a.com')),
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver: undefined,
      supportedResources: { Patient: Patient },
    }

    const maker = vi.fn((_originUrl: ReadonlyUrl) => Effect.succeed(originState))

    const org = makeOrg({ 'https://a.com': makeDefinition('t') })
    const encodedUrl = encode('https://a.com')

    const userOrg1 = decodeUserOrg({
      originUserConfigs: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'a@example.com',
        },
      },
    })
    const userOrg2 = decodeUserOrg({
      originUserConfigs: {
        [encodedUrl]: {
          _tag: 'google_user_oauth_token',
          email: 'b@example.com',
        },
      },
    })

    await Effect.runPromise(
      collectAll(
        mapOrgStreamToHubState<[OriginFactory<typeof Patient, object>]>(
          [asFactory({ make: maker, tag: 't' })],
          Stream.make(makeInput(org, userOrg1), makeInput(org, userOrg2))
        )
      ).pipe(Effect.scoped)
    )

    // Email changed, so maker should be called twice
    expect(maker).toHaveBeenCalledTimes(2)
  })
})
