import { Context, Effect, Layer } from 'effect'

import {
  AuthzError,
  NotFoundError,
  UnhandledError,
  type AuthError,
} from '@assessmentis/ontology'

import { CurrentOrg } from '../tagClasses'
import { CurrentUserId } from '../tagClasses/CurrentUserId'
import { DocumentStore } from '../tagClasses/DocumentStore'

export class OrgUserService extends Context.Tag('OrgUserService')<
  OrgUserService,
  {
    ensureRole: (
      allowedRoles: readonly string[]
    ) => Effect.Effect<void, AuthError | AuthzError | UnhandledError, never>
  }
>() {}

export const OrgUserServiceLayer = Layer.effect(
  OrgUserService,
  Effect.gen(function* () {
    const orgSlug = yield* CurrentOrg
    const { userId } = yield* CurrentUserId
    const documentStore = yield* DocumentStore

    const ensureRole: typeof OrgUserService.Service.ensureRole = (
      allowedRoles
    ) =>
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
          yield* Effect.fail(
            new AuthzError({ message: 'Not authorized org user' })
          )
        }
        return undefined
      }).pipe(Effect.asVoid)

    return { ensureRole }
  })
)
