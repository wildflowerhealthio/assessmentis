import type { OAuthTokens, UserId } from '@assessmentis/platform-domain'
import { Effect } from 'effect'
import { FirebaseAdmin } from './FirebaseAdmin'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

export class AuthRepository extends Effect.Service<AuthRepository>()(
  'AuthRepository',
  {
    dependencies: [FirebaseAdmin.Default],
    effect: Effect.gen(function* () {
      const { firestore: db } = yield* FirebaseAdmin

      // Get refresh token
      const getRefreshToken = (
        userId: UserId
      ): Effect.Effect<
        string,
        UnhandledError | NotFoundError<'RefreshToken', { userId: UserId }>
      > =>
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
              new UnhandledError({
                message: 'Refresh token not found',
                cause: _cause,
              }),
          })

          const data = docSnapshot.data()
          if (!data || typeof data.token !== 'string') {
            return yield* Effect.fail(
              new NotFoundError({
                resourceType: 'RefreshToken',
                params: { userId },
              })
            )
          }

          return data.token
        })

      // Store OAuth tokens
      const storeOAuthTokens = (
        userId: UserId,
        tokens: OAuthTokens
      ): Effect.Effect<void, UnhandledError> =>
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
                new UnhandledError({
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
              catch: (cause: unknown) =>
                new UnhandledError({
                  message: 'Failed to store refresh token',
                  cause,
                }),
            }),
          ]).pipe(Effect.asVoid)
        })

      // Update access token
      const updateAccessToken = (
        userId: UserId,
        accessToken: string,
        expiresAt: Date
      ): Effect.Effect<void, UnhandledError> =>
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
            catch: (cause: unknown) =>
              new UnhandledError({
                message: 'Failed to update access token',
                cause,
              }),
          })
        })

      return { getRefreshToken, storeOAuthTokens, updateAccessToken }
    }),
  }
) {}
