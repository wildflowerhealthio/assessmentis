import { Effect } from 'effect'

import {
  AuthzError,
  NotFoundError,
  UnhandledError,
  type AuthError,
} from '@assessmentis/ontology'

import { CurrentOrg } from '../tagClasses'
import { CurrentUserId } from '../tagClasses/CurrentUserId'
import { DocumentStore } from '../tagClasses/DocumentStore'

/**
 * Utilities for the current user within the current org.
 *
 * @remarks
 * Provides role-checking logic scoped to the authenticated user within their
 * current organization. The default implementation reads from
 * {@link DocumentStore}.
 *
 * @see {@link OrgUserService.Default} for the standard DocumentStore-backed layer
 */
export class OrgUserService extends Effect.Service<OrgUserService>()(
  'OrgUserService',
  {
    effect: Effect.gen(function* () {
      const orgSlug = yield* CurrentOrg
      const { userId } = yield* CurrentUserId
      const documentStore = yield* DocumentStore

      /**
       * Asserts that the current user holds at least one of the given roles
       * in the current org. Fails with {@link AuthzError} otherwise.
       */
      const ensureRole = (
        allowedRoles: readonly string[]
      ): Effect.Effect<void, AuthError | AuthzError | UnhandledError, never> =>
        Effect.gen(function* () {
          const data = yield* documentStore
            .get('orgs', orgSlug, 'users', userId)
            .pipe(
              Effect.mapError((error) =>
                error instanceof NotFoundError
                  ? new AuthzError({ message: 'Not authorized org user' })
                  : error
              )
            )

          if (
            !(
              data &&
              typeof data === 'object' &&
              'roles' in data &&
              Array.isArray(data.roles)
            )
          ) {
            return yield* Effect.fail(
              new UnhandledError({
                message: `User roles missing or invalid for user ${userId} in org ${orgSlug}`,
              })
            )
          }
          if (!data.roles.some((role: string) => allowedRoles.includes(role))) {
            return yield* Effect.fail(
              new AuthzError({ message: 'Not authorized org user' })
            )
          }
          return undefined
        }).pipe(Effect.asVoid)

      return { ensureRole }
    }),
  }
) {}

/**
 * Standard {@link OrgUserService} layer backed by {@link DocumentStore}.
 * Requires {@link CurrentOrg}, {@link CurrentUserId}, and {@link DocumentStore}.
 *
 * @deprecated Use {@link OrgUserService.Default} instead.
 */
export const OrgUserServiceLayer = OrgUserService.Default
