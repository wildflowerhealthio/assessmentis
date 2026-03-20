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
 * Builds the Firestore document root URL for a Firebase project.
 *
 * @param config - Firebase project and database identifiers
 * @returns A `firebase://{projectId}/firestore/{databaseId}` ReadonlyUrl
 *
 * @remarks
 * This is the base URL for all Firestore documents (orgs, users, user-orgs).
 * Platform-domain URL helpers append document paths (e.g. `orgs/{slug}`)
 * to form fully-qualified resource URLs. Supports `ReadonlyUrl.hasChild()`
 * for Hub origin routing.
 */
const buildFirestoreBaseUrl = (config: FirebaseUrlConfig): ReadonlyUrl =>
  ReadonlyUrl.make({
    protocol: 'firebase:',
    host: config.projectId,
    pathname: `/firestore/${config.databaseId}`,
  })

/**
 * Builds the Firebase Auth root URL for a Firebase project.
 *
 * @param projectId - The Firebase project identifier
 * @returns A `firebase://{projectId}/auth/currentUser` ReadonlyUrl
 *
 * @remarks
 * This is the base URL for per-user auth credentials (e.g. proxy tokens).
 * It represents a different storage root than Firestore — credentials come
 * from Firebase Auth, not from document collections.
 */
const buildAuthBaseUrl = (projectId: string): ReadonlyUrl =>
  ReadonlyUrl.make({
    protocol: 'firebase:',
    host: projectId,
    pathname: '/auth/currentUser',
  })

export { type FirebaseUrlConfig, buildAuthBaseUrl, buildFirestoreBaseUrl }
