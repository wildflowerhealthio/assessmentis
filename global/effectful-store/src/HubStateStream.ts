import {
  Effect,
  Either,
  Equal,
  Exit,
  HashMap,
  Record as EffectRecord,
  Scope,
  Stream,
} from 'effect'

import { UnhandledError } from '@assessmentis/ontology'

import { ReadonlyUrl } from './ReadonlyUrl'
import type { HubState } from './hub/types'
import type * as Origin from './Origin'
import type { Resource } from '.'

// --- Generic input interfaces ---

/**
 * Minimal shape an origin definition must satisfy for the hub state builder.
 * Mirrors the structural subset of `BaseOriginDefinition` that the builder
 * actually reads. Extra properties are preserved at runtime (via Schema's
 * `onExcessProperty: 'preserve'`) and participate in structural equality
 * checks.
 */
export interface OriginDefinition<in DomainTypes extends string>
  extends Equal.Equal {
  readonly _tag: string
  readonly supportedResources: { readonly [x: string]: true } & {
    readonly [k in DomainTypes]: true
  }
}

/**
 * A snapshot of origin definitions extracted from whatever domain-level
 * container the caller uses. This is the generic replacement for the
 * platform-domain `Org + UserOrg` pair.
 *
 * `origins` maps URI-encoded origin URLs to their definitions. Callers
 * are expected to merge any additional configuration (server-level or
 * per-user) into each definition before constructing the snapshot.
 */
export interface OriginSourceSnapshot<
  OriginDefinitions extends {
    readonly [encodedUrl: string]: OriginDefinition<never>
  } = {
    readonly [encodedUrl: string]: OriginDefinition<never>
  },
> {
  readonly origins: OriginDefinitions
}

/**
 * Protocol for origin construction used by {@link hubStateStream}. The `tag`
 * must match the `_tag` field on the origin definition. The `make` factory
 * receives the full definition (with any additional configuration already
 * merged in) and returns an Effect producing the origin state.
 */
export interface OriginFactory<
  in SupportedClasses extends Resource.AnyDomainClass,
  in TConfig,
  out R = never,
> {
  readonly tag: string
  readonly make: <Keys extends SupportedClasses['DomainType']>(
    originUrl: ReadonlyUrl,
    config: OriginDefinition<Keys> & TConfig
  ) => Effect.Effect<
    Origin.AnyState<SupportedClasses & { DomainType: Keys }>,
    never,
    R | Scope.Scope
  >
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OriginFactoryResources<O extends OriginFactory<any, any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  O extends OriginFactory<any, any, infer R> ? R : never

type OriginCacheEntry<SupportedClasses extends Resource.AnyDomainClass> = {
  readonly def: OriginDefinition<never>
  readonly state: Origin.AnyState<SupportedClasses>
  readonly scope: Scope.CloseableScope
}

type OriginCache = Map<string, OriginCacheEntry<never>>

// --- Error origin helper ---

const toSupportedClasses = <_DomainTypes extends string>(_map: {
  [k: string]: true
}): object => ({})

type SupportedClasses<_DomainTypes extends string> = never

/**
 * Constructs an errored origin state for an unrecognized origin tag.
 */
const makeUnsupportedOrigin = <DomainTypes extends string>(
  originUrl: ReadonlyUrl,
  def: OriginDefinition<DomainTypes>
): Origin.Errored<SupportedClasses<DomainTypes>> => ({
  originUrl,
  supportedResources: toSupportedClasses<DomainTypes>(def.supportedResources),
  resolver: undefined,
  errorStatus: new UnhandledError({
    message: `Unsupported origin tag '${def._tag}'`,
  }),
  provokeReauthenticate: () => Effect.void,
  provokeReauthorize: () => Effect.void,
})

// --- Build HubState with caching ---

const buildHubState = <R>(
  originMakers: {
    [tag: string]: (
      originUrl: ReadonlyUrl,
      definition: OriginDefinition<never>
    ) => Effect.Effect<Origin.AnyState<never>, never, R | Scope.Scope>
  },
  snapshot: OriginSourceSnapshot,
  cache: OriginCache
): Effect.Effect<[OriginCache, HubState], never, R | Scope.Scope> =>
  Effect.gen(function* () {
    const newCache: OriginCache = new Map()
    const state = new Map<string, Origin.AnyState<never>>()

    for (const [url, def] of EffectRecord.toEntries(snapshot.origins)) {
      const originUrl = ReadonlyUrl.fromEncoded(url)
      const urlKey = originUrl.toString()

      const cached = cache.get(urlKey)
      if (cached && Equal.equals(cached.def, def)) {
        newCache.set(urlKey, cached)
        state.set(urlKey, cached.state)
      } else if (def._tag in originMakers) {
        // Close the old scope if this is a replacement (definition changed)
        if (cached) yield* Scope.close(cached.scope, Exit.void)
        // Safe: `in` check above guarantees the maker exists
        const maker = originMakers[def._tag]!
        const childScope = yield* Scope.make()
        const origin = yield* maker(originUrl, def).pipe(
          Effect.provideService(Scope.Scope, childScope)
        )
        newCache.set(urlKey, {
          def,
          state: origin,
          scope: childScope,
        })
        state.set(urlKey, origin)
      } else {
        const errorOrigin = makeUnsupportedOrigin(originUrl, def)
        const childScope = yield* Scope.make()
        newCache.set(urlKey, {
          def,
          state: errorOrigin,
          scope: childScope,
        })
        state.set(urlKey, errorOrigin)
      }
    }

    for (const oldKey of cache.keys()) {
      if (!newCache.has(oldKey)) {
        const entry = cache.get(oldKey)!
        yield* Scope.close(entry.scope, Exit.void)
        yield* Effect.log(`Origin deregistered: ${oldKey}`)
      }
    }

    return [newCache, HashMap.fromIterable(state)] satisfies [
      OriginCache,
      HubState,
    ]
  })

/**
 * Produces a `Stream<Either<HubState, E>>` from a stream of origin source
 * snapshots and a set of origin factories. Caches origin states and only
 * reconstructs when the definition or origin config for a URL changes
 * (compared via `Equal.equals` on definitions that implement `Equal.Equal`).
 *
 * This is the generic, domain-agnostic core. Domain packages map their
 * concrete types (e.g. `Org`, `UserOrg`) into {@link OriginSourceSnapshot}
 * before passing them to this function.
 *
 * The `R` parameter propagates the context requirements of the origin
 * factories into the returned stream, so callers can provide those services
 * externally.
 */
export const hubStateStream = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Factories extends ReadonlyArray<OriginFactory<any, object, R>>,
  E,
  R,
>(
  originFactories: Factories,
  sourceStream: Stream.Stream<
    Either.Either<OriginSourceSnapshot, E>,
    never,
    Scope.Scope
  >
): Stream.Stream<Either.Either<HubState, E>, never, R | Scope.Scope> => {
  const originMakers = Object.fromEntries(
    originFactories.map((ot) => [ot.tag, ot.make])
  )

  type Output = Either.Either<HubState, E>

  return Stream.mapAccumEffect(
    sourceStream,
    new Map() as OriginCache,
    (
      cache,
      inputEither
    ): Effect.Effect<[OriginCache, Output], never, R | Scope.Scope> => {
      if (Either.isLeft(inputEither)) {
        return Effect.succeed([cache, Either.left(inputEither.left)])
      }
      const snapshot = inputEither.right
      return buildHubState(originMakers, snapshot, cache).pipe(
        Effect.map(
          ([newCache, hubState]) =>
            [newCache, Either.right(hubState)] satisfies [OriginCache, Output]
        )
      )
    }
  )
}
