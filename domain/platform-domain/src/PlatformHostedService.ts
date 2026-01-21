import { Deferred, Option, Effect } from 'effect'
import { UserId } from './models/UserId'
import { User } from './models/User'
import { OrgSlug } from './models/IdTypes'
import { Org } from './models/Org'

export default interface PlatformHostedService {
  setOrgSlug: (orgSlug: Option.Option<OrgSlug>) => Effect.Effect<void>
  deferredUserId: () => Effect.Effect<Deferred.Deferred<UserId>>
  deferredUser: () => Effect.Effect<Deferred.Deferred<User>>
  deferredOrgSlug: () => Effect.Effect<Deferred.Deferred<OrgSlug>>
  deferredOrg: () => Effect.Effect<Deferred.Deferred<Org>>
}
