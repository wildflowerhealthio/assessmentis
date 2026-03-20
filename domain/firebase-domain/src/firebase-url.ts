import { ReadonlyUrl } from '@assessmentis/effectful-store'

/**
 * Configuration identifying a Firestore database within a Firebase project.
 * Infrastructure provides these values at runtime.
 */
interface FirebaseUrlConfig {
  readonly projectId: string
  readonly databaseId: string
}

/**
 * Builds the base {@link ReadonlyUrl} for a Firestore database.
 *
 * @param config - Firebase project and database identifiers
 * @returns A `firebase://{projectId}/firestore/{databaseId}` ReadonlyUrl
 *
 * @remarks
 * The URL scheme uses `firebase:` as the protocol and the project ID as the
 * host, followed by `/firestore/{databaseId}` as the pathname prefix. This
 * mirrors where data is physically stored and supports
 * `ReadonlyUrl.hasChild()` for Hub origin routing.
 *
 * Platform-domain URL helpers append document paths (e.g. `orgs/{slug}`)
 * to this base URL to form fully-qualified resource URLs.
 */
const buildFirebaseBaseUrl = (config: FirebaseUrlConfig): ReadonlyUrl =>
  ReadonlyUrl.make({
    protocol: 'firebase:',
    host: config.projectId,
    pathname: `/firestore/${config.databaseId}`,
  })

export { type FirebaseUrlConfig, buildFirebaseBaseUrl }
