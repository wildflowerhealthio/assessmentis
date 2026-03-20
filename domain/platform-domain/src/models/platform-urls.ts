import { Effect, Predicate, Schema } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { DataIntegrityError } from '@assessmentis/ontology'

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
//
// Builders are pure (not Effects) because they construct from known-valid
// inputs. URL-unsafe characters in slugs and user IDs are percent-encoded
// by ReadonlyUrl.toString() via the URL constructor, and decoded back by
// the parsers via decodeURIComponent — the round-trip is reliable.
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
// Parsers are Effects because the URL may not match the expected base or
// path structure. They strip the base URL prefix, validate the segment
// count, and decode URI-encoded values.
// ---------------------------------------------------------------------------

/**
 * Strips the base URL pathname prefix from a full pathname.
 *
 * @param baseUrl - The expected base URL prefix
 * @param fullPathname - The full pathname to strip
 * @returns The relative path after the base prefix
 *
 * @remarks
 * Fails with {@link DataIntegrityError} if the pathname does not start with
 * the base URL prefix — this indicates the URL was not constructed from the
 * expected base.
 */
const stripBase = (
  baseUrl: ReadonlyUrl,
  fullPathname: string
): Effect.Effect<string, DataIntegrityError> => {
  const base = baseUrl.pathname.replace(/\/+$/, '')
  const full = fullPathname.replace(/\/+$/, '')
  if (full.startsWith(base)) {
    return Effect.succeed(full.slice(base.length))
  }
  return Effect.fail(
    new DataIntegrityError({
      message: `URL pathname "${fullPathname}" does not start with base "${baseUrl.pathname}"`,
    })
  )
}

/**
 * Validates that a segments array has at least `minLength` elements and
 * extracts the segment at `index`, URI-decoding it.
 */
const segmentAt = (
  segments: readonly string[],
  index: number,
  label: string
): Effect.Effect<string, DataIntegrityError> => {
  if (Predicate.isString(segments[index])) {
    return Effect.succeed(decodeURIComponent(segments[index]))
  }
  return Effect.fail(
    new DataIntegrityError({
      message: `Expected segment at index ${index} (${label}) but path only has ${segments.length} segments`,
    })
  )
}

/**
 * Extracts the org slug from an {@link OrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded Org URL
 * @returns An Effect yielding the org slug, or {@link DataIntegrityError}
 *
 * @remarks
 * Expects relative path of the form `/orgs/{slug}`.
 */
const orgSlugFromUrl = (
  baseUrl: ReadonlyUrl,
  url: OrgUrl
): Effect.Effect<OrgSlug, DataIntegrityError> =>
  Effect.gen(function* () {
    const relative = yield* stripBase(baseUrl, url.pathname)
    const segments = relative.split('/')
    // ['', 'orgs', slug]
    const slug = yield* segmentAt(segments, 2, 'slug')
    return OrgSlug.make(slug)
  })

/**
 * Extracts the user ID from a {@link UserUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded User URL
 * @returns An Effect yielding the user ID, or {@link DataIntegrityError}
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}`.
 */
const userIdFromUrl = (
  baseUrl: ReadonlyUrl,
  url: UserUrl
): Effect.Effect<UserId, DataIntegrityError> =>
  Effect.gen(function* () {
    const relative = yield* stripBase(baseUrl, url.pathname)
    const segments = relative.split('/')
    // ['', 'users', userId]
    const uid = yield* segmentAt(segments, 2, 'userId')
    return UserId.make(uid)
  })

/**
 * Extracts the user ID from a {@link UserOrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded UserOrg URL
 * @returns An Effect yielding the user ID, or {@link DataIntegrityError}
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
 */
const userIdFromUserOrgUrl = (
  baseUrl: ReadonlyUrl,
  url: UserOrgUrl
): Effect.Effect<UserId, DataIntegrityError> =>
  Effect.gen(function* () {
    const relative = yield* stripBase(baseUrl, url.pathname)
    const segments = relative.split('/')
    // ['', 'users', userId, 'orgs', slug]
    const uid = yield* segmentAt(segments, 2, 'userId')
    return UserId.make(uid)
  })

/**
 * Extracts the org slug from a {@link UserOrgUrl}.
 *
 * @param baseUrl - The store base URL used to construct the URL
 * @param url - A branded UserOrg URL
 * @returns An Effect yielding the org slug, or {@link DataIntegrityError}
 *
 * @remarks
 * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
 */
const orgSlugFromUserOrgUrl = (
  baseUrl: ReadonlyUrl,
  url: UserOrgUrl
): Effect.Effect<OrgSlug, DataIntegrityError> =>
  Effect.gen(function* () {
    const relative = yield* stripBase(baseUrl, url.pathname)
    const segments = relative.split('/')
    // ['', 'users', userId, 'orgs', slug]
    const slug = yield* segmentAt(segments, 4, 'slug')
    return OrgSlug.make(slug)
  })

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
