import { Effect, Exit } from 'effect'
import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { info } from 'firebase-functions/logger'

import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { CurrentUserId } from '@assessmentis/platform-domain'

import { CurrentUserIdLayerLive } from '../layers/CurrentUserIdLayerLive'
import { makeRequestRuntime } from '../util/BaseLayer'
import {
  defaultHttpOptions,
  oauth2Client,
  scopes,
} from '../util/functionContext'
import { handleError } from '../util/handleError'

/**
 * Generate Google OAuth authorization URL for a verified user
 */
export const googleLoginEffect = (
  request: Request
): Effect.Effect<{ url: string }, AuthError | UnhandledError, CurrentUserId> =>
  Effect.gen(function* () {
    const { userId } = yield* CurrentUserId
    // Verify authentication

    // Generate authorization URL
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent',
      state: JSON.stringify({ uid: userId, hostname: request.hostname }),
    })

    return { url: authorizationUrl }
  })

export const googleLogin = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for Google OAuth login')
    const runtime = makeRequestRuntime(CurrentUserIdLayerLive, { request })
    await runtime.runPromiseExit(googleLoginEffect(request)).then((exit) =>
      exit.pipe(
        Exit.match({
          onSuccess: (value) => {
            response.set('Cache-Control', 'private, max-age=0, s-maxage=0')
            response.status(200).json(value)
          },
          onFailure: (error) => {
            handleError(error, response)
          },
        })
      )
    )
  }
)
