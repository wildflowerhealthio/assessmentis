import { Effect, Either, Scope, Stream } from 'effect'
import {
  AuthData,
  AuthError,
  DocumentStore,
} from '@assessmentis/platform-domain'
import { LoadedGapiClient } from '../services/LoadedGapiClient'
import { NotFoundError } from '@assessmentis/ontology'

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

    const syncToken = async (
      authToken: string,
      token: string,
      expiresAt: Date,
      expiresInMillis: number
    ) => {
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
      })

      console.log(`Got Token it expires at ${expiresAt}, in ${expiresInMillis}`)
      client.setToken({ access_token: token })
    }

    const accessTokenStream = userStream.pipe(
      Stream.flatMap(
        Either.match({
          onRight({
            userId,
            authToken,
          }): Stream.Stream<
            Either.Either<void, AuthError | NotFoundError>,
            never
          > {
            return documentStore
              .subscribeTo('users', userId, 'tokens', 'googleOAuthAccessToken')
              .pipe(
                Stream.map(
                  Either.map((data) => {
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
                      console.error(
                        'No access token found for user',
                        data?.expiresAt
                      )
                      return
                    }
                    const expiresInMillis = expiresAt?.getTime() - Date.now()
                    if (authTokenRefreshTimeout) {
                      clearTimeout(authTokenRefreshTimeout)
                    }
                    const shouldSyncInMillis = expiresInMillis - 5 * 60 * 1000

                    if (shouldSyncInMillis > 0) {
                      client.setToken({ access_token: token })
                      authTokenRefreshTimeout = setTimeout(
                        () =>
                          syncToken(
                            authToken,
                            token,
                            expiresAt,
                            expiresInMillis
                          ),
                        shouldSyncInMillis
                      )
                    } else {
                      syncToken(authToken, token, expiresAt, expiresInMillis)
                    }
                  })
                )
              )
          },
          onLeft(
            left
          ): Stream.Stream<
            Either.Either<void, AuthError | NotFoundError>,
            never
          > {
            return Stream.succeed(Either.left(left))
          },
        })
      )
    )
    return yield* Effect.forkDaemon(
      Stream.runForEach(accessTokenStream, (_) => Effect.sync(() => {}))
    )
  })
