import type { Scope } from 'effect'
import {
  Effect,
  Either,
  Equal,
  HashMap,
  Record as EffectRecord,
  Stream,
} from 'effect'

import { UnhandledError } from '@assessmentis/ontology'
import { deepDataStruct } from '@assessmentis/util'

import { ReadonlyUrl } from './ReadonlyUrl'
import type { HubState } from './hub/types'
import type * as Origin from './Origin'
import type * as Resource from './Resource'

// --- Generic input interfaces ---

/**
 * Minimal shape an origin definition must satisfy for the hub state builder.
 * Mirrors the structural subset of `BaseOriginDefinition` that the builder
 * actually reads. Extra properties are preserved at runtime (via Schema's
 * `onExcessProperty: 'preserve'`) and participate in structural equality
 * checks.
 */
export interface OriginConfig {
  readonly _tag: string
  readonly supportedResources: { readonly [x: string]: true }
  readonly originConfig?: Record<string, unknown> | undefined
}

/**
 * A snapshot of origin definitions and optional per-origin configuration,
 * extracted from whatever domain-level container the caller uses. This is
 * the generic replacement for the platform-domain `Org + UserOrg` pair.
 *
 * - `origins` maps URI-encoded origin URLs to their definitions.
 * - `originConfigs` optionally maps the same keys to per-user
 *    (or per org) configuration blobs (e.g. OAuth tokens).
 */
export interface OriginSourceSnapshot<
  OriginConfigs extends { readonly [encodedUrl: string]: OriginConfig } = {
    readonly [encodedUrl: string]: OriginConfig
  },
> {
  readonly origins: OriginConfigs
  readonly originConfigs?:
    | {
        readonly [x: string]: Record<string, unknown> | undefined
      }
    | undefined
}

/**
 * Protocol for origin construction used by {@link hubStateStream}. The `tag`
 * must match the `_tag` field on the origin definition. The `make` factory
 * receives the full definition (with extra properties intact) and an optional
 * per-user config blob, and returns an Effect producing the origin state.
 */
export interface OriginFactory<
  Resources extends Resource.ResourceSet,
  R = never,
> {
  readonly tag: string
  readonly make: (
    originUrl: ReadonlyUrl,
    config: OriginConfig,
    originConfig: Record<string, unknown> | undefined
  ) => Effect.Effect<Origin.AnyState<Resources, never>, never, R | Scope.Scope>
}

// --- Definition equality via Data/Equal ---

/**
 * Wraps a definition and its origin config into a deep `Data.struct` so that
 * `Equal.equals` performs structural comparison across emissions.
 */
const wrapForEquality = (
  def: OriginConfig,
  originConfig: Record<string, unknown> | undefined
): Equal.Equal =>
  deepDataStruct({
    ...def,
    _originConfig: originConfig,
  })

type OriginCacheEntry<Resources extends Resource.ResourceSet> = {
  readonly wrappedDef: Equal.Equal
  readonly state: Origin.AnyState<Resources, never>
}

type OriginCache<Resources extends Resource.ResourceSet> = Map<
  string,
  OriginCacheEntry<Resources>
>

// --- Error origin helper ---

/**
 * Constructs an errored origin state for an unrecognized origin tag.
 * Built at the concrete `ResourceSet` level first, then widened — this
 * lets TypeScript verify the `supportedResources` assignment without
 * needing to prove index-signature-to-mapped-type compatibility in a
 * generic context.
 */
const makeUnsupportedOrigin = <Resources extends Resource.ResourceSet>(
  originUrl: ReadonlyUrl,
  def: OriginConfig
): Origin.Errored<Resources, never> => {
  const concrete: Origin.Errored<Resource.ResourceSet, never> = {
    originUrl,
    supportedResources: def.supportedResources,
    resolver: undefined,
    errorStatus: new UnhandledError({
      message: `Unsupported origin tag '${def._tag}'`,
    }),
    provokeReauthenticate: () => Effect.void,
    provokeReauthorize: () => Effect.void,
  }
  return concrete
}

// --- Build HubState with caching ---

const buildHubState = <Resources extends Resource.ResourceSet, R>(
  originMakers: {
    [tag: string]: (
      originUrl: ReadonlyUrl,
      definition: OriginConfig,
      originConfig: Record<string, unknown> | undefined
    ) => Effect.Effect<
      Origin.AnyState<Resources, never>,
      never,
      R | Scope.Scope
    >
  },
  snapshot: OriginSourceSnapshot,
  cache: OriginCache<Resources>
): Effect.Effect<
  [OriginCache<Resources>, HubState<Resources>],
  never,
  R | Scope.Scope
> =>
  Effect.gen(function* () {
    const newCache: OriginCache<Resources> = new Map()
    const state = new Map<string, Origin.AnyState<Resources, never>>()

    for (const [url, def] of EffectRecord.toEntries(
      snapshot.origins as { [key: string]: OriginConfig }
    )) {
      const originUrl = ReadonlyUrl.fromEncoded(url)
      const urlKey = originUrl.toString()
      const originConfig: Record<string, unknown> | undefined =
        snapshot.originConfigs?.[url]

      const wrapped = wrapForEquality(def, originConfig)

      const cached = cache.get(urlKey)
      if (cached && Equal.equals(cached.wrappedDef, wrapped)) {
        newCache.set(urlKey, cached)
        state.set(urlKey, cached.state)
      } else if (def._tag in originMakers) {
        // Safe: `in` check above guarantees the maker exists
        const maker = originMakers[def._tag]!
        const origin = yield* maker(originUrl, def, originConfig)
        newCache.set(urlKey, { wrappedDef: wrapped, state: origin })
        state.set(urlKey, origin)
      } else {
        const errorOrigin = makeUnsupportedOrigin<Resources>(originUrl, def)
        newCache.set(urlKey, { wrappedDef: wrapped, state: errorOrigin })
        state.set(urlKey, errorOrigin)
      }
    }

    for (const oldKey of cache.keys()) {
      if (!newCache.has(oldKey)) {
        yield* Effect.log(`Origin deregistered: ${oldKey}`)
      }
    }

    return [newCache, HashMap.fromIterable(state)] as [
      OriginCache<Resources>,
      HubState<Resources>,
    ]
  })

/**
 * Produces a `Stream<Either<HubState, E>>` from a stream of origin source
 * snapshots and a set of origin factories. Caches origin states and only
 * reconstructs when the definition or origin config for a URL changes
 * (compared via `Equal.equals` on `Data.struct`-wrapped definitions).
 *
 * This is the generic, domain-agnostic core. Domain packages map their
 * concrete types (e.g. `Org`, `UserOrg`) into {@link OriginSourceSnapshot}
 * before passing them to this function.
 *
 * The `R` parameter propagates the context requirements of the origin
 * factories into the returned stream, so callers can provide those services
 * externally.
 */
export const hubStateStream = <Resources extends Resource.ResourceSet, R, E>(
  originFactories: readonly OriginFactory<Resources, R>[],
  sourceStream: Stream.Stream<
    Either.Either<OriginSourceSnapshot, E>,
    never,
    Scope.Scope
  >
): Stream.Stream<
  Either.Either<HubState<Resources>, E>,
  never,
  R | Scope.Scope
> => {
  const originMakers = Object.fromEntries(
    originFactories.map((ot) => [ot.tag, ot.make])
  )

  type Output = Either.Either<HubState<Resources>, E>

  return Stream.mapAccumEffect(
    sourceStream,
    new Map() as OriginCache<Resources>,
    (
      cache,
      inputEither
    ): Effect.Effect<
      [OriginCache<Resources>, Output],
      never,
      R | Scope.Scope
    > => {
      if (Either.isLeft(inputEither)) {
        return Effect.succeed([cache, Either.left(inputEither.left)])
      }
      const snapshot = inputEither.right
      return buildHubState(originMakers, snapshot, cache).pipe(
        Effect.map(
          ([newCache, hubState]) =>
            [newCache, Either.right(hubState)] as [
              OriginCache<Resources>,
              Output,
            ]
        )
      )
    }
  )
}
