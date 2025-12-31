import { Context, Effect, Layer, ParseResult, Schema } from 'effect'
import { Org, OrgError } from './loadedValues/Org'
import { User } from './loadedValues/User'
import { UserId } from './loadedValues/UserId'
import { ClientRuntimeContext } from './UserPlatformService'

// Reuse ClientRuntimeContext for server (includes all repositories)
export type ServerRuntimeContext = ClientRuntimeContext

// Error types for server operations
export class OrgNotFoundError extends Schema.TaggedClass<OrgNotFoundError>()(
  'OrgNotFoundError',
  {
    orgSlug: Schema.String, // OrgSlug
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class UserNotFoundError extends Schema.TaggedClass<UserNotFoundError>()(
  'UserNotFoundError',
  {
    userId: Schema.String, // UserId
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class FirebaseAdminError extends Schema.TaggedClass<FirebaseAdminError>()(
  'FirebaseAdminError',
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class TokenNotFoundError extends Schema.TaggedClass<TokenNotFoundError>()(
  'TokenNotFoundError',
  {
    userId: Schema.String, // UserId
    tokenType: Schema.String,
  }
) {}

// OAuth token schema
export const OAuthTokens = Schema.Struct({
  accessToken: Schema.String,
  refreshToken: Schema.String,
  expiresAt: Schema.optional(Schema.Date),
  scope: Schema.optional(Schema.String),
  tokenType: Schema.optional(Schema.String),
})
export type OAuthTokens = typeof OAuthTokens.Type

/**
 * Server-side platform service - per-org instances
 *
 * Unlike UserPlatformService (client-side with reactive streams),
 * ServerPlatformService uses Effect operations for request/response patterns.
 *
 * Each instance is bound to a specific org (orgSlug baked in).
 * Create via ServerPlatformServiceLayer(orgSlug) factory.
 */
export class ServerPlatformService extends Context.Tag('ServerPlatformService')<
  ServerPlatformService,
  {
    /**
     * Get the org configuration for this service instance's org
     */
    getOrg: () => Effect.Effect<Org, OrgError>

    /**
     * Get the runtime layer configured for this org
     * Includes all repositories and services based on org's frontendConfig
     */
    getRuntime: () => Effect.Effect<
      Layer.Layer<ServerRuntimeContext, never>,
      OrgError
    >

    /**
     * Get a user's roles within this service instance's org
     */
    getUserOrgRoles: (
      userId: UserId
    ) => Effect.Effect<ReadonlyArray<string>, UserNotFoundError>

    /**
     * Get a secret from this org's secrets collection
     * Type-safe with schema validation
     */
    getOrgSecret: <T>(
      secretName: string,
      schema: Schema.Schema<T, unknown, never>
    ) => Effect.Effect<T, OrgNotFoundError | ParseResult.ParseError>

    /**
     * Verify a Firebase ID token and return the user ID
     * Global operation (not org-specific)
     */
    verifyIdToken: (token: string) => Effect.Effect<UserId, FirebaseAdminError>

    /**
     * Get a user's profile by ID
     * Global operation (not org-specific)
     */
    getUser: (userId: UserId) => Effect.Effect<User, UserNotFoundError>

    /**
     * Store OAuth tokens for a user
     * Stores both access and refresh tokens to Firestore
     */
    storeOAuthTokens: (
      userId: UserId,
      tokens: OAuthTokens
    ) => Effect.Effect<void, FirebaseAdminError>

    /**
     * Get the refresh token for a user
     */
    getRefreshToken: (
      userId: UserId
    ) => Effect.Effect<string, TokenNotFoundError>

    /**
     * Update the access token for a user
     */
    updateAccessToken: (
      userId: UserId,
      accessToken: string,
      expiresAt: Date
    ) => Effect.Effect<void, FirebaseAdminError>
  }
>() {}
