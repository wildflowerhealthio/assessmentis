import { DateTime, Effect, Exit, Layer, Option } from 'effect'
import type { Response } from 'express'
import { error, info } from 'firebase-functions/logger'
import { onRequest } from 'firebase-functions/v2/https'
import type { Request } from 'firebase-functions/v2/https'

import {
  GoogleUserOAuthLiveCredential,
  GoogleUserOAuthToken,
} from '@assessmentis/google-account-infrastructure'
import { AuthError } from '@assessmentis/ontology'
import type { AuthzError, UnhandledError } from '@assessmentis/ontology'
import { UserId } from '@assessmentis/platform-domain'
import type { DocumentStore } from '@assessmentis/platform-domain'

import { google } from 'googleapis'

import { makeRequestRuntime } from '../util/base-layer'
import { defaultHttpOptions, oauth2Client } from '../util/function-context'
import { handleError } from '../util/handle-error'

/**
 * Process OAuth callback with authorization code
 */
export const oAuthCallbackEffect = (q: {
  error?: string | string[]
  code?: string | string[]
  state?: string | string[]
}): Effect.Effect<string, AuthError | AuthzError | UnhandledError, DocumentStore> =>
  Effect.gen(function* oAuthCallbackEffectGen() {
    info('Received OAuth callback with query params:', q)
    if (q.error) {
      let errorMessage: string
      if (typeof q.error === 'string') {
        errorMessage = q.error
      } else if (Array.isArray(q.error)) {
        errorMessage = q.error.join(', ')
      } else {
        errorMessage = String(q.error)
      }
      // An error response e.g. error=access_denied
      error(`Error:${errorMessage}`)

      return yield* Effect.fail(new AuthError({ cause: q.error, message: errorMessage }))
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

    if (!(access_token && refresh_token && id_token && email && typeof email === 'string' && uid)) {
      return yield* Effect.fail(new AuthError({ message: 'Missing required tokens or email' }))
    }

    const userId = UserId.make(uid)

    const token = new GoogleUserOAuthToken({
      accessToken: access_token,
      email,
      // oxlint-disable-next-line eslint/no-ternary -- inline property in object literal
      expiresAt: tokens.expiry_date
        ? DateTime.unsafeMake(tokens.expiry_date)
        : DateTime.unsafeMake(Date.now() + 3600000),
      // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.some is not an array method
      refreshToken: Option.some(refresh_token),
      scope: tokens.scope ?? '',
    })

    yield* GoogleUserOAuthLiveCredential.store(
      { _tag: 'google_user_oauth_token', email, userId },
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
    await runtime.runPromiseExit(oAuthCallbackEffect(request.query)).then((exit) => {
      exit.pipe(
        Exit.match({
          onFailure: (err) => {
            handleError(err, response)
          },
          onSuccess: (redirectUrl) => {
            response.redirect(redirectUrl)
          },
        })
      )
    })
  }
)
