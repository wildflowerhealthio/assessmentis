import { Data, Either, Match, pipe, Stream } from 'effect'
import type { Scope } from 'effect'

import { hubStateStream as genericHubStateStream } from '@assessmentis/effectful-store'
import type {
  Hub,
  OriginDefinition,
  OriginFactory,
  OriginFactoryResources,
  OriginSourceSnapshot,
} from '@assessmentis/effectful-store'
import { Loading } from '@assessmentis/ontology'
import { StreamEither } from '@assessmentis/util'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
} from '@assessmentis/ontology'

import { NoSelectedOrgError } from '../hostedServices/OrgService'
import type { OrgSlug } from '../models/IdTypes'
import type { Org } from '../models/Org'
import type { UserOrg } from '../models/UserOrg'

/**
 * Maps platform-domain `Org` + `UserOrg` into the generic
 * {@link OriginSourceSnapshot} expected by effectful-store's
 * `hubStateStream`. Merges per-user configuration into each origin
 * definition via shallow spread, so the factory receives a single
 * merged config object.
 */
const toOriginSourceSnapshot = (
  org: Org,
  userOrg: UserOrg | undefined
): OriginSourceSnapshot => ({
  origins: Object.fromEntries(
    Object.entries(org.origins).map(
      ([url, def]) =>
        [
          url,
          Data.struct({
            ...userOrg?.originUserConfigs?.[
              url as keyof typeof userOrg.originUserConfigs
            ],
            ...def,
          }) as OriginDefinition<never>,
        ] as const
    )
  ),
})

/**
 * Produces a `Stream<Either<HubState, HubError>>` from an org+userOrg stream
 * and effectful origin makers. Caches origin states and only reconstructs when
 * the definition or credential identity for an origin URL changes (compared via
 * `Equal.equals` on `Data.struct`-wrapped definitions).
 *
 * This is a thin wrapper over effectful-store's generic `hubStateStream` that
 * maps platform-domain types (`Org`, `UserOrg`, `OriginFactory`) into the generic
 * interfaces.
 *
 * The `R` parameter propagates the context requirements of the origin makers
 * into the returned stream, so callers can provide those services externally.
 */
export const mapOrgStreamToHubState = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Factories extends ReadonlyArray<OriginFactory<any, any, any | never>>,
>(
  originTypes: Factories,
  orgStream: Stream.Stream<
    Either.Either<
      { org: Org; userOrg: UserOrg | undefined },
      | NoSelectedOrgError
      | Loading<{ orgSlug: OrgSlug }>
      | AuthError
      | AuthzError
      | UnhandledError
    >,
    never,
    Scope.Scope
  >
): Stream.Stream<
  Either.Either<
    Hub.HubState,
    Loading<'Configuration'> | AuthError | AuthzError | UnhandledError
  >,
  never,
  OriginFactoryResources<Factories[number]> | Scope.Scope
> => {
  // Convert NoSelectedOrgError → Loading before the generic hub stream,
  // then map org+userOrg to OriginSourceSnapshots
  const snapshotStream = orgStream.pipe(
    StreamEither.mapLeft(
      (
        err
      ): Loading<'Configuration'> | AuthError | AuthzError | UnhandledError =>
        err instanceof NoSelectedOrgError || err instanceof Loading
          ? new Loading({ entity: 'Configuration' as const })
          : err
    ),
    Stream.map((either) =>
      Either.map(either, ({ org, userOrg }) =>
        toOriginSourceSnapshot(org, userOrg)
      )
    )
  )

  type SnapshotErrors =
    | Loading<'Configuration'>
    | AuthError
    | AuthzError
    | UnhandledError

  return pipe(
    genericHubStateStream<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readonly OriginFactory<any, any, any>[],
      SnapshotErrors,
      OriginFactoryResources<Factories[number]>
    >(originTypes, snapshotStream),
    StreamEither.mapError(
      Match.typeTags<
        Loading<'Configuration'> | AuthError | AuthzError | UnhandledError
      >()({
        Loading: () => new Loading({ entity: 'Configuration' } as const),
        AuthError: (e) => e,
        AuthzError: (e) => e,
        UnhandledError: (e) => e,
      })
    )
  )
}
