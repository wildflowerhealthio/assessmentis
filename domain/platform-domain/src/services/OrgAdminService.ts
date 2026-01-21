import { Context, Effect, Layer, Schema } from 'effect'
import { User } from '../models/User'
import { UserId } from '../models/UserId'
import { ClientRuntimeContext } from '../UserPlatformService'
import { AuthError, AuthzError } from '../errors'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { CurrentOrg, DocumentStore } from '../tagClasses'

// Reuse ClientRuntimeContext for server (includes all repositories)
export type ServerRuntimeContext = ClientRuntimeContext

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
export class OrgAdminService extends Context.Tag('OrgAdminService')<
  OrgAdminService,
  {
    /**
     * Get a user's roles within this service instance's org
     */
    getUserOrgRoles: (
      userId: UserId
    ) => Effect.Effect<
      ReadonlyArray<string>,
      AuthError | AuthzError | NotFoundError | UnhandledError
    >

    /**
     * Get a user's profile by ID
     * Global operation (not org-specific)
     */
    getUser: (
      userId: UserId
    ) => Effect.Effect<
      User,
      AuthError | AuthzError | NotFoundError | UnhandledError
    >
  }
>() {}

export const OrgAdminServiceLayer = Layer.effect(
  OrgAdminService,
  Effect.gen(function* () {
    const orgSlug = yield* CurrentOrg
    const documentStore = yield* DocumentStore

    // Get user from Firestore
    const getUser: typeof OrgAdminService.Service.getUser = (userId) =>
      Effect.gen(function* () {
        const data = yield* documentStore.get('users', userId)
        if (data == undefined) {
          return yield* Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId },
            })
          )
        }

        return yield* Schema.decodeUnknown(User)(data).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({
                message: 'Error decoding User document',
                cause,
              })
          )
        )
      })

    // Get user's roles in this org
    const getUserOrgRoles: typeof OrgAdminService.Service.getUserOrgRoles = (
      userId
    ) =>
      Effect.gen(function* () {
        const data = yield* documentStore.get('orgs', orgSlug, 'users', userId)
        if (data == undefined) {
          return yield* Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId },
            })
          )
        }

        if (!('roles' in data) || !Array.isArray(data.roles)) {
          return yield* Effect.fail(
            new UnhandledError({
              message: `User roles missing or invalid for user ${userId} in org ${orgSlug}`,
            })
          )
        }
        return data.roles as ReadonlyArray<string>
      })

    return {
      getUser,
      getUserOrgRoles,
    }
  })
)
