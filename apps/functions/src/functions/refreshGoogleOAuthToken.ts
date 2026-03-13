import { DateTime, Effect, Exit, Layer, Option } from 'effect'
import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { error, info } from 'firebase-functions/logger'

import {
  GoogleUserOAuthLiveCredential,
  type GoogleUserCredentialIdentifier,
} from '@assessmentis/google-account-infrastructure'
import { parseCredentialId } from '@assessmentis/config-domain'
import {
  AuthError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  CurrentUserId,
  type DocumentStore,
} from '@assessmentis/platform-domain'

import { makeAuthedRequestRuntime } from '../util/BaseLayer'
import { defaultHttpOptions, oauth2Client } from '../util/functionContext'
import { handleError } from '../util/handleError'

/**
 * Refresh a credential by its credential ID.
 *
 * Currently supports:
 * - `google_user_oauth_token:{email}` — refreshes the Google OAuth access token
 */
export const refreshCredentialEffect = (
  credentialId: string
): Effect.Effect<
  Record<string, never>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AuthError | NotFoundError<string, any> | UnhandledError,
  CurrentUserId | DocumentStore
> =>
  Effect.gen(function* () {
    const { userId } = yield* CurrentUserId

    // Parse credential tag and key from the credential ID
    const parsed = parseCredentialId(credentialId)
    if (Option.isNone(parsed)) {
      return yield* Effect.fail(
        new AuthError({
          message: `Invalid credential ID format: ${credentialId}`,
        })
      )
    }
    const { tag: credentialTag, key: credentialKey } = parsed.value

    switch (credentialTag) {
      case 'google_user_oauth_token': {
        const email = credentialKey
        const identifier: GoogleUserCredentialIdentifier = {
          _tag: 'google_user_oauth_token',
          userId,
          email,
        }

        // Read the current credential to get the refresh token
        const currentToken = yield* GoogleUserOAuthLiveCredential.readOnce(
          identifier
        ).pipe(
          Effect.mapError((err) =>
            err._tag === 'BadDataError'
              ? new UnhandledError({
                  message: err.message,
                  cause: err,
                })
              : err
          )
        )
        const refreshToken = Option.getOrUndefined(currentToken.refreshToken)

        if (!refreshToken) {
          return yield* Effect.fail(
            new NotFoundError({
              resourceType: 'RefreshToken',
              params: { userId, email },
            })
          )
        }

        // Refresh the access token using Google OAuth2 client
        oauth2Client.setCredentials({ refresh_token: refreshToken })

        const refreshTokenResponse = yield* Effect.tryPromise({
          try: () => oauth2Client.refreshAccessToken(),
          catch: (cause: unknown) =>
            new AuthError({
              message: 'Failed to refresh access token',
              cause,
            }),
        })

        const { access_token, expiry_date } = refreshTokenResponse.credentials

        if (!access_token) {
          return yield* Effect.fail(
            new AuthError({ message: 'No access token in response' })
          )
        }

        // Write back the refreshed token
        const refreshedToken = currentToken.withRefreshedAccess(
          access_token,
          DateTime.unsafeMake(expiry_date ?? Date.now() + 3600000)
        )
        yield* GoogleUserOAuthLiveCredential.store(identifier, refreshedToken)

        return {}
      }

      default:
        return yield* Effect.fail(
          new AuthError({
            message: `Unsupported credential type: ${credentialTag}`,
          })
        )
    }
  })

export const refreshCredential = onRequest(
  { ...defaultHttpOptions, memory: '512MiB' },
  async (request: Request, response: Response) => {
    // Parse credential_id from URL path: /api/credentials/:credential_id
    const pathMatch = request.path.match(/^\/api\/credentials\/(.+)$/)
    if (!pathMatch?.[1]) {
      error('Invalid credential refresh URL:', request.path)
      response.status(400).json({ message: 'Missing credential ID in URL' })
      return
    }

    const credentialId = decodeURIComponent(pathMatch[1])
    info('Received request to refresh credential:', credentialId)

    const runtime = makeAuthedRequestRuntime(Layer.empty, {
      request,
    })

    await runtime
      .runPromiseExit(refreshCredentialEffect(credentialId))
      .then((exit) =>
        exit.pipe(
          Exit.match({
            onSuccess: () => response.status(200).json({ success: true }),
            onFailure: (cause) => {
              handleError(
                cause,
                response,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (err: NotFoundError<string, any>) => {
                  if (err instanceof NotFoundError) {
                    response
                      .status(404)
                      .json({ message: 'Credential not found' })
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
