import type { Org } from './org'
import type { User } from './user'
import type { UserOrg } from './user-org'

/**
 * Union of all platform entity class constructors that satisfy the
 * `DomainClass` interface from effectful-store.
 *
 * @remarks
 * Used to parameterize Hub and Repository types when platform entities
 * need to be served alongside clinical resources.
 */
export type PlatformEntityClasses = typeof Org | typeof User | typeof UserOrg
