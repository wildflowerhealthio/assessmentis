import { Either, Stream, type Scope } from 'effect'

import {
  hubStateStream as genericHubStateStream,
  type Hub,
  type OriginSourceSnapshot,
  type Resource,
} from '@assessmentis/effectful-store'
import {
  type AuthError,
  type AuthzError,
  type Loading,
  type UnhandledError,
} from '@assessmentis/ontology'

import type { OrgSlug } from '../models/IdTypes'
import type { Org } from '../models/Org'
import type { OriginFactory } from '../models/OriginFactory'
import type { UserOrg } from '../models/UserOrg'

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
export const hubStateStream = <Resources extends Resource.ResourceSet, R>(
  originTypes: readonly OriginFactory<Resources, R>[],
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
  // Map the org stream to produce OriginSourceSnapshots
  const snapshotStream = Stream.map(orgStream, (either) =>
    Either.map(either, ({ org, userOrg }) =>
      toOriginSourceSnapshot(org, userOrg)
    )
  )

  return genericHubStateStream(originTypes, snapshotStream)
}
