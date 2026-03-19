import { Effect, Layer } from 'effect'

import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import { AuthError } from '@assessmentis/ontology'
import { CurrentUserId, UserId } from '@assessmentis/platform-domain'

import { FunctionsContext } from '../tags/functions-context'

export const CurrentUserIdLayerLive = Layer.effect(
  CurrentUserId,
  Effect.gen(function* CurrentUserIdLayerLive() {
    const { request } = yield* FunctionsContext
    const { auth } = yield* FirebaseAdmin

    const authHeader = request.headers['authorization']
    const authHeaderPrefix = 'Bearer '

    if (!authHeader || !authHeader.startsWith(authHeaderPrefix)) {
      return yield* Effect.fail(
        new AuthError({
          message: 'Missing or invalid authorization header',
        })
      )
    }
    const authToken = authHeader.slice(authHeaderPrefix.length)

    const decodedToken = yield* Effect.tryPromise({
      catch: (cause) =>
        new AuthError({
          message: 'Failed to verify ID token',
          cause,
        }),
      try: () => auth.verifyIdToken(authToken),
    })

    const userId = UserId.make(decodedToken.uid)

    return {
      authToken,
      userId,
    }
  })
)
