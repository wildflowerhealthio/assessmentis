import { Schema } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { OrgSlug } from './id-types'
import { Org } from './org'
import { User } from './user'
import { UserId } from './user-id'
import { UserOrg } from './user-org'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Branded URL type for {@link Org} resources. */
type OrgUrl = typeof Org.UrlSchema.Type

/** Branded URL type for {@link User} resources. */
type UserUrl = typeof User.UrlSchema.Type

/** Branded URL type for {@link UserOrg} resources. */
type UserOrgUrl = typeof UserOrg.UrlSchema.Type

/**
 * Runtime configuration identifying the Firebase project and Firestore
 * database that platform entity URLs target.
 */
interface FirebaseUrlConfig {
  readonly projectId: string
  readonly databaseId: string
}

// ---------------------------------------------------------------------------
// URL Builders — document path → branded URL
// ---------------------------------------------------------------------------

const buildFirebaseUrl = (config: FirebaseUrlConfig, documentPath: string): ReadonlyUrl =>
  ReadonlyUrl.make({
    protocol: 'firebase:',
    host: config.projectId,
    pathname: `/firestore/${config.databaseId}/${documentPath}`,
  })

const decodeOrgUrl = Schema.decodeSync(Org.UrlSchema)
const decodeUserUrl = Schema.decodeSync(User.UrlSchema)
const decodeUserOrgUrl = Schema.decodeSync(UserOrg.UrlSchema)

/**
 * Builds a branded {@link OrgUrl} for an org document.
 *
 * @param config - Firebase project and database identifiers
 * @param slug - The org's URL-safe slug
 * @returns A branded `Org/url` ReadonlyUrl
 */
const orgUrl = (config: FirebaseUrlConfig, slug: OrgSlug): OrgUrl =>
  decodeOrgUrl(buildFirebaseUrl(config, `orgs/${slug}`).toString())

/**
 * Builds a branded {@link UserUrl} for a user document.
 *
 * @param config - Firebase project and database identifiers
 * @param userId - The user's Firebase UID
 * @returns A branded `User/url` ReadonlyUrl
 */
const userUrl = (config: FirebaseUrlConfig, userId: UserId): UserUrl =>
  decodeUserUrl(buildFirebaseUrl(config, `users/${userId}`).toString())

/**
 * Builds a branded {@link UserOrgUrl} for a user-org subcollection document.
 *
 * @param config - Firebase project and database identifiers
 * @param userId - The user's Firebase UID
 * @param slug - The org's URL-safe slug
 * @returns A branded `UserOrg/url` ReadonlyUrl
 */
const userOrgUrl = (config: FirebaseUrlConfig, userId: UserId, slug: OrgSlug): UserOrgUrl =>
  decodeUserOrgUrl(buildFirebaseUrl(config, `users/${userId}/orgs/${slug}`).toString())

// ---------------------------------------------------------------------------
// URL Parsers — branded URL → document path segments
// ---------------------------------------------------------------------------

/**
 * Extracts the org slug from an {@link OrgUrl}.
 *
 * @param url - A branded Org URL
 * @returns The org slug extracted from the URL pathname
 *
 * @remarks
 * Expects pathname of the form `/firestore/$databaseId/orgs/$slug`.
 */
const orgSlugFromUrl = (url: OrgUrl): OrgSlug => {
  const segments = url.pathname.split('/')
  // ['', 'firestore', databaseId, 'orgs', slug]
  return OrgSlug.make(decodeURIComponent(segments[4]))
}

/**
 * Extracts the user ID from a {@link UserUrl}.
 *
 * @param url - A branded User URL
 * @returns The user ID extracted from the URL pathname
 *
 * @remarks
 * Expects pathname of the form `/firestore/$databaseId/users/$userId`.
 */
const userIdFromUrl = (url: UserUrl): UserId => {
  const segments = url.pathname.split('/')
  // ['', 'firestore', databaseId, 'users', userId]
  return UserId.make(decodeURIComponent(segments[4]))
}

/**
 * Extracts the user ID from a {@link UserOrgUrl}.
 *
 * @param url - A branded UserOrg URL
 * @returns The user ID extracted from the URL pathname
 *
 * @remarks
 * Expects pathname of the form `/firestore/$databaseId/users/$userId/orgs/$slug`.
 */
const userIdFromUserOrgUrl = (url: UserOrgUrl): UserId => {
  const segments = url.pathname.split('/')
  // ['', 'firestore', databaseId, 'users', userId, 'orgs', slug]
  return UserId.make(decodeURIComponent(segments[4]))
}

/**
 * Extracts the org slug from a {@link UserOrgUrl}.
 *
 * @param url - A branded UserOrg URL
 * @returns The org slug extracted from the URL pathname
 *
 * @remarks
 * Expects pathname of the form `/firestore/$databaseId/users/$userId/orgs/$slug`.
 */
const orgSlugFromUserOrgUrl = (url: UserOrgUrl): OrgSlug => {
  const segments = url.pathname.split('/')
  // ['', 'firestore', databaseId, 'users', userId, 'orgs', slug]
  return OrgSlug.make(decodeURIComponent(segments[6]))
}

export {
  type FirebaseUrlConfig,
  type OrgUrl,
  type UserOrgUrl,
  type UserUrl,
  orgSlugFromUrl,
  orgSlugFromUserOrgUrl,
  orgUrl,
  userIdFromUrl,
  userIdFromUserOrgUrl,
  userOrgUrl,
  userUrl,
}
