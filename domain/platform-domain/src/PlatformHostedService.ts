import type { Deferred, Option, Effect } from 'effect'
import type { UserId } from './models/UserId'
import type { User } from './models/User'
import type { OrgSlug } from './models/IdTypes'
import type { Org } from './models/Org'

export default interface PlatformHostedService {
  setOrgSlug: (orgSlug: Option.Option<OrgSlug>) => Effect.Effect<void>
  deferredUserId: () => Effect.Effect<Deferred.Deferred<UserId>>
  deferredUser: () => Effect.Effect<Deferred.Deferred<User>>
  deferredOrgSlug: () => Effect.Effect<Deferred.Deferred<OrgSlug>>
  deferredOrg: () => Effect.Effect<Deferred.Deferred<Org>>
}
