import { Either, Match, pipe, Stream } from 'effect'
import type { Scope } from 'effect'

import { hubStateStream as genericHubStateStream } from '@assessmentis/effectful-store'
import type {
  Hub,
  OriginFactory,
  OriginSourceSnapshot,
} from '@assessmentis/effectful-store'
import { Loading } from '@assessmentis/ontology'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
} from '@assessmentis/ontology'

import { NoSelectedOrgError } from '../hostedServices/OrgService'
import type { OrgSlug } from '../models/IdTypes'
import type { Org } from '../models/Org'
import type { UserOrg } from '../models/UserOrg'
import { StreamEither } from '@assessmentis/util'

/**
 * Maps platform-domain `Org` + `UserOrg` into the generic
 * {@link OriginSourceSnapshot} expected by effectful-store's
 * `hubStateStream`.
 */
const toOriginSourceSnapshot = (
  org: Org,
  userOrg: UserOrg | undefined
): OriginSourceSnapshot => ({
  origins: org.origins,
  originConfigs: userOrg?.originConfigs,
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
export const mapOrgStreamToHubState = <R>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originTypes: readonly OriginFactory<any, R>[],
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
  R | Scope.Scope
> => {
  // Convert NoSelectedOrgError → Loading before the generic hub stream,
  // then map org+userOrg to OriginSourceSnapshots
  const snapshotStream = orgStream.pipe(
    StreamEither.mapLeft(
      (
        err
      ):
        | Loading<{ orgSlug: OrgSlug }>
        | AuthError
        | AuthzError
        | UnhandledError =>
        err instanceof NoSelectedOrgError
          ? new Loading({ entity: { orgSlug: '' as OrgSlug } })
          : err
    ),
    Stream.map((either) =>
      Either.map(either, ({ org, userOrg }) =>
        toOriginSourceSnapshot(org, userOrg)
      )
    )
  )

  type SnapshotErrors =
    | Loading<{ orgSlug: OrgSlug }>
    | AuthError
    | AuthzError
    | UnhandledError

  return pipe(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genericHubStateStream<readonly OriginFactory<any, R>[], SnapshotErrors, R>(
      originTypes,
      snapshotStream
    ),
    StreamEither.mapError(
      Match.typeTags<
        Loading<{ orgSlug: OrgSlug }> | AuthError | AuthzError | UnhandledError
      >()({
        Loading: () => new Loading({ entity: 'Configuration' } as const),
        AuthError: (e) => e,
        AuthzError: (e) => e,
        UnhandledError: (e) => e,
      })
    )
  )
}
