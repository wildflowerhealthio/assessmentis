import { Context, Effect, Layer, Schema } from 'effect'

import {
  NotFoundError,
  UnhandledError,
  type AuthError,
  type AuthzError,
} from '@assessmentis/ontology'

import { User } from '../models/User'
import type { UserId } from '../models/UserId'
import { CurrentOrg, DocumentStore } from '../tagClasses'

/**
 * Server-side admin service scoped to a single organization.
 *
 * @remarks
 * Unlike the client-side reactive services, this uses one-shot Effect
 * operations for request/response patterns. Each instance is bound to the
 * org provided by {@link CurrentOrg}.
 *
 * @see {@link OrgAdminServiceLayer} for the standard DocumentStore-backed provider
 */
export class OrgAdminService extends Context.Tag('OrgAdminService')<
  OrgAdminService,
  {
    /** Look up a user's roles within this service instance's org. */
    getUserOrgRoles: (
      userId: UserId
    ) => Effect.Effect<
      ReadonlyArray<string>,
      | AuthError
      | AuthzError
      | NotFoundError<'User', { userId: UserId }>
      | UnhandledError
    >

    /** Fetch a user profile by ID. Global operation (not org-specific). */
    getUser: (
      userId: UserId
    ) => Effect.Effect<
      User,
      | AuthError
      | AuthzError
      | NotFoundError<'User', { userId: UserId }>
      | UnhandledError
    >
  }
>() {}

/**
 * Standard {@link OrgAdminService} layer backed by {@link DocumentStore}.
 * Requires {@link CurrentOrg} and {@link DocumentStore}.
 */
export const OrgAdminServiceLayer = Layer.effect(
  OrgAdminService,
  Effect.gen(function* () {
    const orgSlug = yield* CurrentOrg
    const documentStore = yield* DocumentStore

    // Get user from Firestore
    const getUser: typeof OrgAdminService.Service.getUser = (userId) =>
      Effect.gen(function* () {
        const data = yield* documentStore.get('users', userId).pipe(
          Effect.mapError((cause) =>
            cause instanceof NotFoundError
              ? new NotFoundError({
                  resourceType: 'User',
                  params: { userId },
                })
              : cause
          )
        )
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
        const data = yield* documentStore
          .get('orgs', orgSlug, 'users', userId)
          .pipe(
            Effect.mapError((cause) =>
              cause instanceof NotFoundError
                ? new NotFoundError({
                    resourceType: 'User',
                    params: { userId },
                  })
                : cause
            )
          )
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
