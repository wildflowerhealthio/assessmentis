import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'
import { CurrentUserId, UserId } from '@assessmentis/platform-domain'
import { AuthError } from '@assessmentis/ontology'
import { Effect, Layer } from 'effect'
import { FunctionsContext } from '../tags/FunctionsContext'

export const CurrentUserIdLayerLive = Layer.effect(
  CurrentUserId,
  Effect.gen(function* () {
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
      try: () => auth.verifyIdToken(authToken),
      catch: (cause) =>
        new AuthError({
          message: 'Failed to verify ID token',
          cause,
        }),
    })

    const userId = UserId.make(decodedToken.uid)

    return {
      authToken,
      userId,
    }
  })
)
