import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { PlatformRoutes } from '@assessmentis/platform-domain'

import { buildAuthBaseUrl, buildFirestoreBaseUrl } from './firebase-url'
import type { FirebaseUrlConfig } from './firebase-url'

/**
 * Concrete {@link PlatformRoutes} for Firebase-backed deployments.
 *
 * @remarks
 * Constructs `firebase://{projectId}/firestore/{databaseId}` as the document
 * base URL and `firebase://{projectId}/auth/currentUser` as the auth base URL.
 * All inherited URL builder and parser methods work against these roots.
 *
 * @example
 * ```typescript
 * const routes = new FirebasePlatformRoutes({
 *   projectId: 'my-project',
 *   databaseId: 'my-db',
 * })
 * const url = routes.orgUrl(OrgSlug.make('acme'))
 * // firebase://my-project/firestore/my-db/orgs/acme
 * ```
 */
class FirebasePlatformRoutes extends PlatformRoutes {
  readonly documentBaseUrl: ReadonlyUrl
  readonly currentUserUrl: ReadonlyUrl

  constructor(config: FirebaseUrlConfig) {
    super()
    this.documentBaseUrl = buildFirestoreBaseUrl(config)
    this.currentUserUrl = buildAuthBaseUrl(config.projectId)
  }
}

export { FirebasePlatformRoutes }
