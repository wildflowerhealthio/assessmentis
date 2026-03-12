import type { Deferred, Effect, Option } from 'effect'

import type { OrgSlug } from './models/IdTypes'
import type { Org } from './models/Org'
import type { User } from './models/User'
import type { UserId } from './models/UserId'

export default interface PlatformHostedService {
  setOrgSlug: (orgSlug: Option.Option<OrgSlug>) => Effect.Effect<void>
  deferredUserId: () => Effect.Effect<Deferred.Deferred<UserId>>
  deferredUser: () => Effect.Effect<Deferred.Deferred<User>>
  deferredOrgSlug: () => Effect.Effect<Deferred.Deferred<OrgSlug>>
  deferredOrg: () => Effect.Effect<Deferred.Deferred<Org>>
}
