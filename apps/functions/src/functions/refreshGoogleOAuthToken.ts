import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { info } from 'firebase-functions/logger'
import { Effect, Exit, Layer } from 'effect'
import { CurrentUserId } from '@assessmentis/platform-domain'
import { AuthError, NotFoundError } from '@assessmentis/ontology'
import { defaultHttpOptions, oauth2Client } from '../util/functionContext'
import { CurrentUserIdLayerLive } from '../layers/CurrentUserIdLayerLive'
import { handleError } from '../util/handleError'
import type { UnhandledError } from '@assessmentis/ontology'
import { AuthRepository } from '@assessmentis/firebase-server-infrastructure'
import { makeRequestRuntime } from '../util/BaseLayer'

/**
 * Refresh Google OAuth access token for a verified user
 */
export const refreshGoogleOAuthTokenEffect: Effect.Effect<
  Record<string, never>,
  | AuthError
  | NotFoundError<'RefreshToken', { userId: string }>
  | UnhandledError,
  AuthRepository | CurrentUserId
> = Effect.gen(function* () {
  const authRepository = yield* AuthRepository
  const { userId } = yield* CurrentUserId

  // Get refresh token from Firestore
  const refreshToken = yield* authRepository.getRefreshToken(userId)

  // Refresh the access token using Google OAuth2 client
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const refreshTokenResponse = yield* Effect.tryPromise({
    try: () => oauth2Client.refreshAccessToken(),
    catch: (error: unknown) =>
      new AuthError({
        message: 'Failed to refresh access token',
        cause: error,
      }),
  })

  const { access_token, expiry_date } = refreshTokenResponse.credentials

  if (!access_token) {
    return yield* Effect.fail(
      new AuthError({ message: 'No access token in response' })
    )
  }

  // Update the access token in Firestore
  yield* authRepository.updateAccessToken(
    userId,
    access_token,
    expiry_date ? new Date(expiry_date) : new Date(Date.now() + 3600000) // Default to 1 hour if no expiry
  )

  return {}
})

export const refreshGoogleOAuthToken = onRequest(
  { ...defaultHttpOptions, memory: '512MiB' },
  async (request: Request, response: Response) => {
    info('Received request to refresh Google OAuth token')
    const runtime = makeRequestRuntime(
      Layer.merge(AuthRepository.Default, CurrentUserIdLayerLive),
      { request }
    )
    await runtime.runPromiseExit(refreshGoogleOAuthTokenEffect).then((exit) =>
      exit.pipe(
        Exit.match({
          onSuccess: () => response.status(200).json({ success: true }),
          onFailure: (error) => {
            handleError(
              error,
              response,
              (err: NotFoundError<'RefreshToken', { userId: string }>) => {
                if (err instanceof NotFoundError) {
                  response.status(404).json({ message: 'Token not found' })
                  return true
                }
                return false
              }
            )
          },
        })
      )
    )
  }
)
