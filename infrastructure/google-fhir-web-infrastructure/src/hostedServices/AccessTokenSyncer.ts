import { LoadedGapiClient } from '../services/LoadedGapiClient'
import { AuthError, NotFoundError } from '@assessmentis/ontology'
import type { AuthData } from '@assessmentis/platform-domain'
import { DocumentStore } from '@assessmentis/platform-domain'
import { StreamEither } from '@assessmentis/util'
import type { Either, Scope } from 'effect'
import { Effect, Stream } from 'effect'

export const startAccessTokenSyncer = (
  userStream: Stream.Stream<
    Either.Either<AuthData, AuthError>,
    never,
    Scope.Scope
  >
) =>
  Effect.gen(function* () {
    const client = yield* yield* LoadedGapiClient
    const documentStore = yield* DocumentStore
    let authTokenRefreshTimeout: ReturnType<typeof setTimeout> | null = null

    const syncToken = async (authToken: string) => {
      authTokenRefreshTimeout = null

      await fetch('/api/refreshGoogleOAuthToken', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify({}),
      }).catch(function (error) {
        console.log('failed to fetch ' + error)
        throw new AuthError({
          message: 'Failed to refresh Google OAuth token',
          cause: error,
        })
      })
      console.log('Finished refreshing token')
    }

    const accessTokenStream = userStream.pipe(
      StreamEither.flatMap(({ userId, authToken }) =>
        documentStore
          .subscribeTo('users', userId, 'tokens', 'googleOAuthAccessToken')
          .pipe(
            StreamEither.mapLeft((err) =>
              err instanceof NotFoundError
                ? new NotFoundError({
                    resourceType: 'GoogleOAuthAccessToken',
                    params: { userId },
                  })
                : err
            ),
            StreamEither.map((data) => {
              const token =
                data && typeof data.token == 'string' ? data.token : null
              const expiresAt =
                data &&
                'expiresAt' in data &&
                typeof data.expiresAt == 'object' &&
                data.expiresAt !== null &&
                'toDate' in data.expiresAt &&
                typeof data.expiresAt.toDate == 'function' &&
                'toDate' in data.expiresAt
                  ? data.expiresAt.toDate()
                  : null

              if (!(token && expiresAt)) {
                console.error('No access token found for user', data?.expiresAt)
                return
              }
              const expiresInMillis = expiresAt?.getTime() - Date.now()
              if (authTokenRefreshTimeout) {
                clearTimeout(authTokenRefreshTimeout)
              }
              const shouldSyncInMillis = expiresInMillis - 5 * 60 * 1000
              console.log('New token loaded from firebase', {
                shouldSyncInMillis,
                token,
                expiresAt,
                expiresInMillis,
              })
              if (shouldSyncInMillis > 0) {
                client.setToken({ access_token: token })
                authTokenRefreshTimeout = setTimeout(
                  () => syncToken(authToken),
                  shouldSyncInMillis
                )
              } else {
                syncToken(authToken)
              }
            })
          )
      )
    )
    return yield* Effect.forkDaemon(
      Stream.runForEach(accessTokenStream, (_) => Effect.sync(() => {}))
    )
  })
