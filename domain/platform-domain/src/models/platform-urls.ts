import { Effect, Predicate, Schema, pipe } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { DataIntegrityError } from '@assessmentis/ontology'

import { OrgSlug } from './id-types'
import { Org } from './org'
import { User } from './user'
import { UserId } from './user-id'
import { UserOrg } from './user-org'

// ---------------------------------------------------------------------------
// Types — entity URLs
// ---------------------------------------------------------------------------

/** Branded URL type for {@link Org} resources. */
type OrgUrl = typeof Org.UrlSchema.Type

/** Branded URL type for {@link User} resources. */
type UserUrl = typeof User.UrlSchema.Type

/** Branded URL type for {@link UserOrg} resources. */
type UserOrgUrl = typeof UserOrg.UrlSchema.Type

// ---------------------------------------------------------------------------
// Credential URL schemas
// ---------------------------------------------------------------------------

/** Schema for user-scoped credential URLs (e.g. Google OAuth tokens). */
const UserCredentialUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('UserCredential/url'))

/** Branded URL type for user-scoped credentials. */
type UserCredentialUrl = typeof UserCredentialUrlSchema.Type

/** Schema for org-scoped (server) credential URLs (e.g. DailyCo API keys). */
const ServerCredentialUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('ServerCredential/url'))

/** Branded URL type for org-scoped server credentials. */
type ServerCredentialUrl = typeof ServerCredentialUrlSchema.Type

/** Schema for auth-derived credential URLs (e.g. DailyCo proxy tokens). */
const AuthCredentialUrlSchema = pipe(ReadonlyUrl.FromString, Schema.brand('AuthCredential/url'))

/** Branded URL type for auth-derived credentials. */
type AuthCredentialUrl = typeof AuthCredentialUrlSchema.Type

// ---------------------------------------------------------------------------
// Document paths — domain owns the path structure
// ---------------------------------------------------------------------------

/** Relative path for an org document: `orgs/{slug}`. */
const orgPath = (slug: OrgSlug): string => `orgs/${slug}`

/** Relative path for a user document: `users/{userId}`. */
const userPath = (userId: UserId): string => `users/${userId}`

/** Relative path for a user-org document: `users/{userId}/orgs/{slug}`. */
const userOrgPath = (userId: UserId, slug: OrgSlug): string => `users/${userId}/orgs/${slug}`

/** Relative path for a user credential: `users/{userId}/credentials/{credentialId}`. */
const userCredentialPath = (userId: UserId, credentialId: string): string =>
  `users/${userId}/credentials/${credentialId}`

/** Relative path for a server credential: `orgs/{slug}/credentials/{credentialId}`. */
const serverCredentialPath = (slug: OrgSlug, credentialId: string): string =>
  `orgs/${slug}/credentials/${credentialId}`

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const decodeOrgUrl = Schema.decodeSync(Org.UrlSchema)
const decodeUserUrl = Schema.decodeSync(User.UrlSchema)
const decodeUserOrgUrl = Schema.decodeSync(UserOrg.UrlSchema)
const decodeUserCredentialUrl = Schema.decodeSync(UserCredentialUrlSchema)
const decodeServerCredentialUrl = Schema.decodeSync(ServerCredentialUrlSchema)
const decodeAuthCredentialUrl = Schema.decodeSync(AuthCredentialUrlSchema)

/**
 * Strips the base URL pathname prefix from a full pathname.
 *
 * @remarks
 * Fails with {@link DataIntegrityError} if the pathname does not start with
 * the base URL prefix.
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

/** Extracts and URI-decodes a segment at `index`, failing if it doesn't exist. */
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

// ---------------------------------------------------------------------------
// PlatformRoutes — abstract base class
// ---------------------------------------------------------------------------

/**
 * Abstract routing for platform entities. Provides URL builders and
 * effectful parsers that operate relative to two base URLs.
 *
 * @remarks
 * Subclasses provide the concrete base URLs (e.g. `firebase://` in
 * {@link @assessmentis/firebase-domain!FirebasePlatformRoutes}). The
 * methods on this class are infrastructure-agnostic — they only know
 * the document path structure (`orgs/{slug}`, `users/{uid}`, etc.).
 *
 * URL-unsafe characters in slugs and user IDs are percent-encoded by
 * `ReadonlyUrl.toString()` and decoded back by the parsers via
 * `decodeURIComponent` — the round-trip is reliable.
 */
abstract class PlatformRoutes {
  /** Base URL for document storage (orgs, users, user-orgs). */
  abstract readonly documentBaseUrl: ReadonlyUrl

  /** Base URL for auth credentials (e.g. proxy tokens). */
  abstract readonly currentUserUrl: ReadonlyUrl

  /** Builds a branded {@link OrgUrl} for an org document. */
  orgUrl(slug: OrgSlug): OrgUrl {
    return decodeOrgUrl(this.documentBaseUrl.appendToPathname(orgPath(slug)).toString())
  }

  /** Builds a branded {@link UserUrl} for a user document. */
  userUrl(userId: UserId): UserUrl {
    return decodeUserUrl(this.documentBaseUrl.appendToPathname(userPath(userId)).toString())
  }

  /** Builds a branded {@link UserOrgUrl} for a user-org subcollection document. */
  userOrgUrl(userId: UserId, slug: OrgSlug): UserOrgUrl {
    return decodeUserOrgUrl(
      this.documentBaseUrl.appendToPathname(userOrgPath(userId, slug)).toString()
    )
  }

  /** Builds a branded {@link UserCredentialUrl} for a user-scoped credential. */
  userCredentialUrl(userId: UserId, credentialId: string): UserCredentialUrl {
    return decodeUserCredentialUrl(
      this.documentBaseUrl.appendToPathname(userCredentialPath(userId, credentialId)).toString()
    )
  }

  /** Builds a branded {@link ServerCredentialUrl} for an org-scoped server credential. */
  serverCredentialUrl(slug: OrgSlug, credentialId: string): ServerCredentialUrl {
    return decodeServerCredentialUrl(
      this.documentBaseUrl.appendToPathname(serverCredentialPath(slug, credentialId)).toString()
    )
  }

  /** Builds a branded {@link AuthCredentialUrl} for an auth-derived credential. */
  authCredentialUrl(tokenName: string): AuthCredentialUrl {
    return decodeAuthCredentialUrl(
      this.currentUserUrl.appendToPathname(tokenName).toString()
    )
  }

  /**
   * Extracts the org slug from an {@link OrgUrl}.
   *
   * @remarks
   * Expects relative path of the form `/orgs/{slug}`.
   */
  orgSlugFromUrl(url: OrgUrl): Effect.Effect<OrgSlug, DataIntegrityError> {
    return Effect.gen(this, function* () {
      const relative = yield* stripBase(this.documentBaseUrl, url.pathname)
      const segments = relative.split('/')
      const slug = yield* segmentAt(segments, 2, 'slug')
      return OrgSlug.make(slug)
    })
  }

  /**
   * Extracts the user ID from a {@link UserUrl}.
   *
   * @remarks
   * Expects relative path of the form `/users/{userId}`.
   */
  userIdFromUrl(url: UserUrl): Effect.Effect<UserId, DataIntegrityError> {
    return Effect.gen(
      function* (this: PlatformRoutes) {
        const relative = yield* stripBase(this.documentBaseUrl, url.pathname)
        const segments = relative.split('/')
        const uid = yield* segmentAt(segments, 2, 'userId')
        return UserId.make(uid)
      }.bind(this)
    )
  }

  /**
   * Extracts the user ID from a {@link UserOrgUrl}.
   *
   * @remarks
   * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
   */
  userIdFromUserOrgUrl(url: UserOrgUrl): Effect.Effect<UserId, DataIntegrityError> {
    return Effect.gen(
      function* (this: PlatformRoutes) {
        const relative = yield* stripBase(this.documentBaseUrl, url.pathname)
        const segments = relative.split('/')
        const uid = yield* segmentAt(segments, 2, 'userId')
        return UserId.make(uid)
      }.bind(this)
    )
  }

  /**
   * Extracts the org slug from a {@link UserOrgUrl}.
   *
   * @remarks
   * Expects relative path of the form `/users/{userId}/orgs/{slug}`.
   */
  orgSlugFromUserOrgUrl(url: UserOrgUrl): Effect.Effect<OrgSlug, DataIntegrityError> {
    return Effect.gen(
      function* (this: PlatformRoutes) {
        const relative = yield* stripBase(this.documentBaseUrl, url.pathname)
        const segments = relative.split('/')
        const slug = yield* segmentAt(segments, 4, 'slug')
        return OrgSlug.make(slug)
      }.bind(this)
    )
  }
}

export {
  type AuthCredentialUrl,
  AuthCredentialUrlSchema,
  type OrgUrl,
  PlatformRoutes,
  type ServerCredentialUrl,
  ServerCredentialUrlSchema,
  type UserCredentialUrl,
  UserCredentialUrlSchema,
  type UserOrgUrl,
  type UserUrl,
  orgPath,
  userOrgPath,
  userPath,
}
