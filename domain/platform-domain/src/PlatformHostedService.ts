import { Deferred, Option, Effect } from 'effect'
import { UserId } from './loadedValues/UserId'
import { User } from './loadedValues/User'
import { OrgSlug } from './loadedValues/IdTypes'
import { Org } from './loadedValues/Org'

export default interface PlatformHostedService {
  setOrgSlug: (orgSlug: Option.Option<OrgSlug>) => Effect.Effect<void>
  deferredUserId: () => Effect.Effect<Deferred.Deferred<UserId>>
  deferredUser: () => Effect.Effect<Deferred.Deferred<User>>
  deferredOrgSlug: () => Effect.Effect<Deferred.Deferred<OrgSlug>>
  deferredOrg: () => Effect.Effect<Deferred.Deferred<Org>>
}
