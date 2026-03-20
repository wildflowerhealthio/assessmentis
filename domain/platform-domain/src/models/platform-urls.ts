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

// ---------------------------------------------------------------------------
// Document paths — domain owns the path structure
// ---------------------------------------------------------------------------

/** Relative path for an org document: `orgs/{slug}`. */
const orgPath = (slug: OrgSlug): string => `orgs/${slug}`

/** Relative path for a user document: `users/{userId}`. */
const userPath = (userId: UserId): string => `users/${userId}`

/** Relative path for a user-org document: `users/{userId}/orgs/{slug}`. */
const userOrgPath = (userId: UserId, slug: OrgSlug): string => `users/${userId}/orgs/${slug}`

// ---------------------------------------------------------------------------
// URL Builders — base URL + document path → branded URL
// ---------------------------------------------------------------------------

const decodeOrgUrl = Schema.decodeSync(Org.UrlSchema)
const decodeUserUrl = Schema.decodeSync(User.UrlSchema)
const decodeUserOrgUrl = Schema.decodeSync(UserOrg.UrlSchema)

/**
 * Builds a branded {@link OrgUrl} from a base URL and org slug.
 *
 * @param baseUrl - Store base URL (protocol and prefix are infrastructure-provided)
 * @param slug - The org's URL-safe slug
 * @returns A branded `Org/url` ReadonlyUrl
 */
const orgUrl = (baseUrl: ReadonlyUrl, slug: OrgSlug): OrgUrl =>
  decodeOrgUrl(baseUrl.appendToPathname(orgPath(slug)).toString())

/**
 * Builds a branded {@link UserUrl} from a base URL and user ID.
 *
 * @param baseUrl - Store base URL (protocol and prefix are infrastructure-provided)
 * @param userId - The authenticated user's identifier
 * @returns A branded `User/url` ReadonlyUrl
 */
const userUrl = (baseUrl: ReadonlyUrl, userId: UserId): UserUrl =>
  decodeUserUrl(baseUrl.appendToPathname(userPath(userId)).toString())

/**
 * Builds a branded {@link UserOrgUrl} from a base URL, user ID, and org slug.
 *
 * @param baseUrl - Store base URL (protocol and prefix are infrastructure-provided)
 * @param userId - The authenticated user's identifier
 * @param slug - The org's URL-safe slug
 * @returns A branded `UserOrg/url` ReadonlyUrl
 */
const userOrgUrl = (baseUrl: ReadonlyUrl, userId: UserId, slug: OrgSlug): UserOrgUrl =>
  decodeUserOrgUrl(baseUrl.appendToPathname(userOrgPath(userId, slug)).toString())

// ---------------------------------------------------------------------------
// URL Parsers — branded URL → document path segments
//
// Parsers strip the base URL pathname prefix, then parse the remaining
// relative path. This keeps them decoupled from infrastructure URL schemes.
// ---------------------------------------------------------------------------

/** Strips the base URL pathname prefix from a full pathname, returning the relative path. */
const stripBase = (baseUrl: ReadonlyUrl, fullPathname: string): string => {
  const base = baseUrl.pathname.replace(/\/+$/, '')
  const full = fullPathname.replace(/\/+$/, '')
  if (full.startsWith(base)) {
    return full.slice(base.length)
  }
  return full
}

/**
 * Extracts the org slug from an {@link OrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded Org URL
 * @returns The org slug extracted from the relative path
 *
 * @remarks
 * Expects relative path of the form `/orgs/{slug}`.
 */
const orgSlugFromUrl = (baseUrl: ReadonlyUrl, url: OrgUrl): OrgSlug => {
  const segments = stripBase(baseUrl, url.pathname).split('/')
  // ['', 'orgs', slug]
  return OrgSlug.make(decodeURIComponent(segments[2]))
}

/**
 * Extracts the user ID from a {@link UserUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded User URL
 * @returns The user ID extracted from the relative path
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}`.
 */
const userIdFromUrl = (baseUrl: ReadonlyUrl, url: UserUrl): UserId => {
  const segments = stripBase(baseUrl, url.pathname).split('/')
  // ['', 'users', userId]
  return UserId.make(decodeURIComponent(segments[2]))
}

/**
 * Extracts the user ID from a {@link UserOrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded UserOrg URL
 * @returns The user ID extracted from the relative path
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
 */
const userIdFromUserOrgUrl = (baseUrl: ReadonlyUrl, url: UserOrgUrl): UserId => {
  const segments = stripBase(baseUrl, url.pathname).split('/')
  // ['', 'users', userId, 'orgs', slug]
  return UserId.make(decodeURIComponent(segments[2]))
}

/**
 * Extracts the org slug from a {@link UserOrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded UserOrg URL
 * @returns The org slug extracted from the relative path
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
 */
const orgSlugFromUserOrgUrl = (baseUrl: ReadonlyUrl, url: UserOrgUrl): OrgSlug => {
  const segments = stripBase(baseUrl, url.pathname).split('/')
  // ['', 'users', userId, 'orgs', slug]
  return OrgSlug.make(decodeURIComponent(segments[4]))
}

export {
  type OrgUrl,
  type UserOrgUrl,
  type UserUrl,
  orgPath,
  orgSlugFromUrl,
  orgSlugFromUserOrgUrl,
  orgUrl,
  userIdFromUrl,
  userIdFromUserOrgUrl,
  userOrgPath,
  userOrgUrl,
  userPath,
  userUrl,
}
