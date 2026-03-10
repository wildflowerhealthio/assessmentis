import { DateTime, Effect, Exit, Layer, Option } from 'effect'
import { type Response } from 'express'
import { error, info } from 'firebase-functions/logger'
import { onRequest, type Request } from 'firebase-functions/v2/https'

import {
  GoogleUserOAuthLiveCredential,
  GoogleUserOAuthToken,
} from '@assessmentis/google-account-infrastructure'
import {
  AuthError,
  type AuthzError,
  type UnhandledError,
} from '@assessmentis/ontology'
import { DocumentStore, UserId } from '@assessmentis/platform-domain'

import { google } from 'googleapis'

import { makeRequestRuntime } from '../util/BaseLayer'
import { defaultHttpOptions, oauth2Client } from '../util/functionContext'
import { handleError } from '../util/handleError'

/**
 * Process OAuth callback with authorization code
 */
export const oAuthCallbackEffect = (q: {
  error?: string | string[]
  code?: string | string[]
  state?: string | string[]
}): Effect.Effect<
  string,
  AuthError | AuthzError | UnhandledError,
  DocumentStore
> =>
  Effect.gen(function* () {
    info('Received OAuth callback with query params:', q)
    if (q.error) {
      // An error response e.g. error=access_denied
      error('Error:' + q.error)
      const errorMessage = String(q.error)

      return yield* Effect.fail(
        new AuthError({ message: errorMessage, cause: q.error })
      )
    }

    const code = q.code?.toString() ?? ''
    const state = q.state?.toString() ?? '{}'

    // Get access and refresh tokens (if access_type is offline)
    const { tokens } = yield* Effect.promise(() => oauth2Client.getToken(code))

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    })

    const { uid, hostname } = JSON.parse(state)
    const { data } = yield* Effect.promise(() => oauth2.userinfo.get())
    const { email } = data
    const { refresh_token, id_token, access_token } = tokens

    if (
      !(
        access_token &&
        refresh_token &&
        id_token &&
        email &&
        typeof email === 'string' &&
        uid
      )
    ) {
      return yield* Effect.fail(
        new AuthError({ message: 'Missing required tokens or email' })
      )
    }

    const userId = UserId.make(uid)

    const token = new GoogleUserOAuthToken({
      email,
      scope: tokens.scope ?? '',
      accessToken: access_token,
      expiresAt: tokens.expiry_date
        ? DateTime.unsafeMake(tokens.expiry_date)
        : DateTime.unsafeMake(Date.now() + 3600000),
      refreshToken: Option.some(refresh_token),
    })

    yield* GoogleUserOAuthLiveCredential.store(
      { _tag: 'google_user_oauth_token', userId, email },
      token
    )

    info('Stored OAuth credential in Firestore')

    const redirectUrl = `https://${hostname}/authorizeEmail?email=${email ?? ''}&success=true`
    return redirectUrl
  })

export const oAuthCallback = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for OAuth callback')
    const runtime = makeRequestRuntime(Layer.empty, { request })
    await runtime
      .runPromiseExit(oAuthCallbackEffect(request.query))
      .then((exit) =>
        exit.pipe(
          Exit.match({
            onSuccess: (redirectUrl) => {
              response.redirect(redirectUrl)
            },
            onFailure: (error) => {
              handleError(error, response)
            },
          })
        )
      )
  }
)
