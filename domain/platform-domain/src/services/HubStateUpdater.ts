import {
  Effect,
  Either,
  Equal,
  HashMap,
  Record,
  Stream,
  type Scope,
} from 'effect'

import {
  ReadonlyUrl,
  type Hub,
  type Origin,
  type Resource,
} from '@assessmentis/effectful-store'
import {
  UnhandledError,
  type AuthError,
  type AuthzError,
  type Loading,
} from '@assessmentis/ontology'
import { deepDataStruct } from '@assessmentis/util'

import type { BaseOriginDefinition } from '../models/BaseOriginDefinition'
import type { OrgSlug } from '../models/IdTypes'
import type { Org } from '../models/Org'
import type { OriginType } from '../models/OriginType'
import type { UserOrg } from '../models/UserOrg'

// --- Definition equality via Data/Equal ---

const asEqualityCheckable = (
  def: BaseOriginDefinition,
  originConfig: Record<string, unknown> | undefined
) =>
  deepDataStruct({
    ...def,
    _originConfig: originConfig,
  })

type EqualityCheckable = ReturnType<typeof asEqualityCheckable>

type OriginCacheEntry<Resources extends Resource.ResourceSet> = {
  readonly wrappedDef: EqualityCheckable
  readonly state: Origin.AnyState<Resources, never>
}

type OriginCache<Resources extends Resource.ResourceSet> = Map<
  string,
  OriginCacheEntry<Resources>
>

// --- Build HubState with caching ---

const buildHubState = <Resources extends Resource.ResourceSet, R>(
  originMakers: {
    [tag: string]: (
      definition: BaseOriginDefinition,
      originConfig: Record<string, unknown> | undefined
    ) => Effect.Effect<
      Origin.AnyState<Resources, never>,
      never,
      R | Scope.Scope
    >
  },
  org: Org,
  userOrg: UserOrg | undefined,
  cache: OriginCache<Resources>
): Effect.Effect<
  [OriginCache<Resources>, Hub.HubState<Resources>],
  never,
  R | Scope.Scope
> =>
  Effect.gen(function* () {
    const newCache: OriginCache<Resources> = new Map()
    const state = new Map<string, Origin.AnyState<Resources, never>>()

    for (const [url, def] of Record.toEntries(org.origins)) {
      const originUrl = ReadonlyUrl.fromEncoded(url)
      const urlKey = originUrl.toString()
      // Widening: TS sees `{ _tag: string }` but `onExcessProperty: 'preserve'`
      // on BaseOriginConfig retains all extra fields at runtime.
      const originConfig: Record<string, unknown> | undefined =
        userOrg?.originConfig[url]

      const wrapped = asEqualityCheckable(def, originConfig)

      const cached = cache.get(urlKey)
      if (cached && Equal.equals(cached.wrappedDef, wrapped)) {
        newCache.set(urlKey, cached)
        state.set(urlKey, cached.state)
      } else if (def._tag in originMakers) {
        // Safe: `in` check above guarantees the maker exists
        const maker = originMakers[def._tag]!
        const origin = yield* maker(def, originConfig)
        newCache.set(urlKey, { wrappedDef: wrapped, state: origin })
        state.set(origin.originUrl.toString(), origin)
      } else {
        const errorOrigin: Origin.AnyState<Resources, never> = {
          originUrl,
          supportedResources: def.activeResources,
          resolver: undefined,
          errorStatus: new UnhandledError({
            message: `Unsupported origin tag '${def._tag}'`,
          }),
          provokeReauthenticate: () => Effect.void,
          provokeReauthorize: () => Effect.void,
        }
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
      Hub.HubState<Resources>,
    ]
  })

/**
 * Produces a `Stream<Either<HubState, HubError>>` from an org+userOrg stream
 * and effectful origin makers. Caches origin states and only reconstructs when
 * the definition or credential identity for an origin URL changes (compared via
 * `Equal.equals` on `Data.struct`-wrapped definitions).
 *
 * The `R` parameter propagates the context requirements of the origin makers
 * into the returned stream, so callers can provide those services externally.
 */
export const hubStateStream = <Resources extends Resource.ResourceSet, R>(
  originTypes: readonly OriginType<Resources, R>[],
  orgStream: Stream.Stream<
    Either.Either<
      { org: Org; userOrg: UserOrg | undefined },
      Loading<{ orgSlug: OrgSlug }> | AuthError | AuthzError | UnhandledError
    >,
    never,
    Scope.Scope
  >
): Stream.Stream<
  Either.Either<
    Hub.HubState<Resources>,
    Loading<{ orgSlug: OrgSlug }> | AuthError | AuthzError | UnhandledError
  >,
  never,
  R | Scope.Scope
> => {
  const originMakers = Object.fromEntries(
    originTypes.map((ot) => [ot.tag, ot.make])
  )

  type OrgError =
    | Loading<{ orgSlug: OrgSlug }>
    | AuthError
    | AuthzError
    | UnhandledError
  type Output = Either.Either<Hub.HubState<Resources>, OrgError>

  return Stream.mapAccumEffect(
    orgStream,
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
      const { org, userOrg } = inputEither.right
      return buildHubState(originMakers, org, userOrg, cache).pipe(
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
