import { Layer, Effect, Schema, Ref } from 'effect'
import {
  ServerPlatformService,
  OrgSlug,
  Org,
  User,
  UserId,
  OrgNotFoundError,
  UserNotFoundError,
  FirebaseAdminError,
  TokenNotFoundError,
} from '@assessmentis/platform-domain'
import { createServerRuntime } from './RuntimeProvider'
import { FirebaseFirestore, FirebaseAuth } from './FirebaseAdminApp'

/**
 * Factory: Creates ServerPlatformService layer for a specific org
 *
 * @param orgSlug - The organization slug this service instance will be bound to
 * @returns Layer that provides ServerPlatformService for the specified org
 */
export const ServerPlatformServiceLayer = (orgSlug: OrgSlug) =>
  Layer.effect(
    ServerPlatformService,
    Effect.gen(function* () {
      const db = yield* FirebaseFirestore
      const auth = yield* FirebaseAuth

      // Cache org data (loaded once per service instance)
      const orgRef = yield* Ref.make<Org | null>(null)

      // Get org from Firestore (cached)
      const getOrg: typeof ServerPlatformService.Service.getOrg = () =>
        Effect.gen(function* () {
          const cached = yield* Ref.get(orgRef)
          if (cached) return cached

          const docSnapshot = yield* Effect.tryPromise({
            try: () => db.collection('orgs').doc(orgSlug).get(),
            catch: (cause) => ({ _tag: 'OrgDataError' as const, cause }),
          })

          const data = docSnapshot.data()
          if (!data) {
            return yield* Effect.fail({
              _tag: 'OrgDataError' as const,
              cause: 'Document not found',
            })
          }

          const org = yield* Schema.decodeUnknown(Org)(data).pipe(
            Effect.mapError((cause) => ({
              _tag: 'OrgDataError' as const,
              cause,
            }))
          )

          yield* Ref.set(orgRef, org)
          return org
        })

      // Get runtime layer for this org
      const getRuntime: typeof ServerPlatformService.Service.getRuntime = () =>
        Effect.gen(function* () {
          const org = yield* getOrg()

          // Create server runtime with no auth token provider for now
          // Functions that need video call tokens should provide their own
          const runtime = createServerRuntime(
            org.frontendConfig,
            async () => undefined
          )

          return runtime
        })

      // Get user from Firestore
      const getUser: typeof ServerPlatformService.Service.getUser = (userId) =>
        Effect.gen(function* () {
          const docSnapshot = yield* Effect.tryPromise({
            try: () => db.collection('users').doc(userId).get(),
            catch: (cause) =>
              new UserNotFoundError({
                userId,
                cause,
              }),
          })

          const data = docSnapshot.data()
          if (!data) {
            return yield* Effect.fail(
              new UserNotFoundError({
                userId,
                cause: 'Document not found',
              })
            )
          }

          return yield* Schema.decodeUnknown(User)(data).pipe(
            Effect.mapError(
              (cause) =>
                new UserNotFoundError({
                  userId,
                  cause,
                })
            )
          )
        })

      // Verify Firebase ID token
      const verifyIdToken: typeof ServerPlatformService.Service.verifyIdToken =
        (token) =>
          Effect.gen(function* () {
            const decodedToken = yield* Effect.tryPromise({
              try: () => auth.verifyIdToken(token),
              catch: (cause) =>
                new FirebaseAdminError({
                  message: 'Failed to verify ID token',
                  cause,
                }),
            })

            return UserId.make(decodedToken.uid)
          })

      // Get user's roles in this org
      const getUserOrgRoles: typeof ServerPlatformService.Service.getUserOrgRoles =
        (userId) =>
          Effect.gen(function* () {
            const docSnapshot = yield* Effect.tryPromise({
              try: () =>
                db
                  .collection('orgs')
                  .doc(orgSlug)
                  .collection('users')
                  .doc(userId)
                  .get(),
              catch: (cause) =>
                new UserNotFoundError({
                  userId,
                  cause,
                }),
            })

            const data = docSnapshot.data()
            if (!data || !('roles' in data) || !Array.isArray(data.roles)) {
              return yield* Effect.fail(
                new UserNotFoundError({
                  userId,
                  cause: `User not found in org ${orgSlug} or missing roles`,
                })
              )
            }

            return data.roles as ReadonlyArray<string>
          })

      // Get org secret with schema validation
      const getOrgSecret: typeof ServerPlatformService.Service.getOrgSecret = (
        secretName,
        schema
      ) =>
        Effect.gen(function* () {
          const docSnapshot = yield* Effect.tryPromise({
            try: () =>
              db
                .collection('orgs')
                .doc(orgSlug)
                .collection('secrets')
                .doc(secretName)
                .get(),
            catch: (cause) =>
              new OrgNotFoundError({
                orgSlug,
                cause,
              }),
          })

          const data = docSnapshot.data()
          if (!data) {
            return yield* Effect.fail(
              new OrgNotFoundError({
                orgSlug,
                cause: `Secret ${secretName} not found`,
              })
            )
          }

          return yield* Schema.decodeUnknown(schema)(data)
        })

      // Store OAuth tokens
      const storeOAuthTokens: typeof ServerPlatformService.Service.storeOAuthTokens =
        (userId, tokens) =>
          Effect.gen(function* () {
            const tokenCollection = db
              .collection('users')
              .doc(userId)
              .collection('tokens')

            yield* Effect.all([
              Effect.tryPromise({
                try: () =>
                  tokenCollection.doc('googleOAuthAccessToken').set({
                    token: tokens.accessToken,
                    expiresAt: tokens.expiresAt,
                    scope: tokens.scope,
                    tokenType: tokens.tokenType,
                    lastUpdated: new Date(),
                  }),
                catch: (cause) =>
                  new FirebaseAdminError({
                    message: 'Failed to store access token',
                    cause,
                  }),
              }),
              Effect.tryPromise({
                try: () =>
                  tokenCollection.doc('googleOAuthRefreshToken').set({
                    token: tokens.refreshToken,
                    lastUpdated: new Date(),
                  }),
                catch: (cause) =>
                  new FirebaseAdminError({
                    message: 'Failed to store refresh token',
                    cause,
                  }),
              }),
            ]).pipe(Effect.asVoid)
          })

      // Get refresh token
      const getRefreshToken: typeof ServerPlatformService.Service.getRefreshToken =
        (userId) =>
          Effect.gen(function* () {
            const docSnapshot = yield* Effect.tryPromise({
              try: () =>
                db
                  .collection('users')
                  .doc(userId)
                  .collection('tokens')
                  .doc('googleOAuthRefreshToken')
                  .get(),
              catch: (_cause) =>
                new TokenNotFoundError({ userId, tokenType: 'refresh' }),
            })

            const data = docSnapshot.data()
            if (!data || typeof data.token !== 'string') {
              return yield* Effect.fail(
                new TokenNotFoundError({ userId, tokenType: 'refresh' })
              )
            }

            return data.token
          })

      // Update access token
      const updateAccessToken: typeof ServerPlatformService.Service.updateAccessToken =
        (userId, accessToken, expiresAt) =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () =>
                db
                  .collection('users')
                  .doc(userId)
                  .collection('tokens')
                  .doc('googleOAuthAccessToken')
                  .set({
                    token: accessToken,
                    expiresAt,
                    lastUpdated: new Date(),
                  }),
              catch: (cause) =>
                new FirebaseAdminError({
                  message: 'Failed to update access token',
                  cause,
                }),
            })
          })

      return {
        getOrg,
        getRuntime,
        getUser,
        verifyIdToken,
        getUserOrgRoles,
        getOrgSecret,
        storeOAuthTokens,
        getRefreshToken,
        updateAccessToken,
      }
    })
  )
