import { Effect, Schema } from 'effect'

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
 * @see {@link OrgAdminService.Default} for the standard DocumentStore-backed layer
 */
export class OrgAdminService extends Effect.Service<OrgAdminService>()(
  'OrgAdminService',
  {
    effect: Effect.gen(function* () {
      const orgSlug = yield* CurrentOrg
      const documentStore = yield* DocumentStore

      /** Fetch a user profile by ID. Global operation (not org-specific). */
      const getUser = (
        userId: UserId
      ): Effect.Effect<
        User,
        | AuthError
        | AuthzError
        | NotFoundError<'User', { userId: UserId }>
        | UnhandledError
      > =>
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

      /** Look up a user's roles within this service instance's org. */
      const getUserOrgRoles = (
        userId: UserId
      ): Effect.Effect<
        ReadonlyArray<string>,
        | AuthError
        | AuthzError
        | NotFoundError<'User', { userId: UserId }>
        | UnhandledError
      > =>
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
          const parsed = yield* Schema.decodeUnknown(
            Schema.Struct({
              roles: Schema.Array(Schema.String),
            })
          )(data).pipe(
            Effect.mapError(
              (cause) =>
                new UnhandledError({
                  message: `User roles missing or invalid for user ${userId} in org ${orgSlug}`,
                  cause,
                })
            )
          )
          return parsed.roles
        })

      return {
        getUser,
        getUserOrgRoles,
      }
    }),
  }
) {}

/**
 * Standard {@link OrgAdminService} layer backed by {@link DocumentStore}.
 * Requires {@link CurrentOrg} and {@link DocumentStore}.
 *
 * @deprecated Use {@link OrgAdminService.Default} instead.
 */
export const OrgAdminServiceLayer = OrgAdminService.Default
