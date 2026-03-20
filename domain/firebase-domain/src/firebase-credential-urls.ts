import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { buildAuthBaseUrl, buildFirestoreBaseUrl } from './firebase-url'
import type { FirebaseUrlConfig } from './firebase-url'

/**
 * Builds a credential URL for a user-scoped credential stored in Firestore.
 *
 * @param config - Firebase project and database identifiers
 * @param userId - The user who owns the credential
 * @param credentialId - The credential document ID
 * @returns A `firebase://{projectId}/firestore/{databaseId}/users/{userId}/credentials/{credentialId}` ReadonlyUrl
 *
 * @remarks
 * Used for credentials tied to a specific user (e.g. Google OAuth tokens).
 * These are readable/writable by the owning user.
 */
const userCredentialUrl = (
  config: FirebaseUrlConfig,
  userId: string,
  credentialId: string
): ReadonlyUrl =>
  buildFirestoreBaseUrl(config).appendToPathname(`users/${userId}/credentials/${credentialId}`)

/**
 * Builds a credential URL for an org-scoped (server) credential stored in Firestore.
 *
 * @param config - Firebase project and database identifiers
 * @param orgSlug - The org that owns the credential
 * @param credentialId - The credential document ID
 * @returns A `firebase://{projectId}/firestore/{databaseId}/orgs/{orgSlug}/credentials/{credentialId}` ReadonlyUrl
 *
 * @remarks
 * Used for credentials tied to an organization (e.g. DailyCo API keys).
 * These are admin-only — only org admins should view or edit server credentials.
 */
const serverCredentialUrl = (
  config: FirebaseUrlConfig,
  orgSlug: string,
  credentialId: string
): ReadonlyUrl =>
  buildFirestoreBaseUrl(config).appendToPathname(`orgs/${orgSlug}/credentials/${credentialId}`)

/**
 * Builds a credential URL for an auth-derived credential (not stored in Firestore).
 *
 * @param projectId - The Firebase project identifier
 * @param tokenName - The token type name (e.g. `'DailyCoProxyToken'`)
 * @returns A `firebase://{projectId}/auth/currentUser/{tokenName}` ReadonlyUrl
 *
 * @remarks
 * Used for credentials derived from Firebase Auth data rather than stored
 * as Firestore documents (e.g. DailyCo proxy tokens). The `auth/currentUser`
 * prefix distinguishes them from Firestore-backed resources while keeping
 * them under the same `firebase://{projectId}` origin for Hub routing.
 */
const authCredentialUrl = (projectId: string, tokenName: string): ReadonlyUrl =>
  buildAuthBaseUrl(projectId).appendToPathname(tokenName)

export { authCredentialUrl, serverCredentialUrl, userCredentialUrl }
