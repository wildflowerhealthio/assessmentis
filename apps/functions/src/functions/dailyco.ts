import { type Response } from 'express'
import { type ParsedQs } from 'qs'
import { onRequest, type Request } from 'firebase-functions/https'
import { info, error } from 'firebase-functions/logger'
import fetch from 'node-fetch'
import { Effect, Data, Exit, Layer } from 'effect'
import {
  LoadedDailyCoSecret,
  OrgSlug,
  OrgUserService,
  OrgUserServiceLayer,
} from '@assessmentis/platform-domain'
import { defaultHttpOptions } from '../util/functionContext'
import { handleError } from '../util/handleError'
import { DailyCoSecretLayerLive } from '../layers/orgSecretLayers'
import { makeRequestRuntime } from '../util/BaseLayer'
import { CurrentOrgLayerLive } from '../layers/CurrentOrgLayerLive'
import { CurrentUserIdLayerLive } from '../layers/CurrentUserIdLayerLive'

class DailyCoError extends Data.TaggedError('DailyCoError')<{
  message: string
  cause: unknown
}> {
  constructor(message: string, cause: unknown) {
    super({ message, cause })
  }
}

/**
 * Proxy a request to Daily.co API with org-specific authentication
 */
export const dailycoEffect = (
  inbound: {
    method: string
    rawBody: Buffer
    headers: Record<string, string | string[] | undefined>
    query: ParsedQs
  },
  destination: string
) =>
  Effect.gen(function* () {
    // Verify authentication
    const orgContext = yield* OrgUserService
    const rolesWithDailyCoAccess = ['admin', 'clinician'] as const
    yield* orgContext.ensureRole(rolesWithDailyCoAccess)

    const secret = yield* LoadedDailyCoSecret

    // Build Daily.co API URL
    const queryParams = new URLSearchParams(
      Object.entries(inbound.query).map(([key, value]) => [key, String(value)])
    )
    const url = `https://api.daily.co/v1/${destination}?${queryParams}`

    // Prepare headers (filter out sensitive headers)
    const {
      host: _host,
      'set-cookie': _setCookie,
      authorization: _authorization,
      ...forwardedHeaders
    } = inbound.headers

    const headers = {
      ...forwardedHeaders,
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + secret.apiKey,
    }

    info('Forwarding request to Daily.co API:', inbound.method, url)

    // Proxy request to Daily.co
    const externalRes = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          headers,
          method: inbound.method,
          body: inbound.rawBody,
        }),
      catch: (error): DailyCoError =>
        new DailyCoError(
          `Failed to fetch from Daily.co: ${String(error)}`,
          error
        ),
    })

    return { externalRes }
  })

export const dailyco = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for Daily.co proxy:', request.method, request.path)

    // Extract org slug and destination from URL
    const urlMatch = request.path.match(
      /^\/api\/daily-co-proxies\/([^/]+)\/(.*)$/
    )

    if (urlMatch == null || urlMatch.length < 3) {
      error('Invalid URL')
      response.status(400).json({
        message: 'Bad Request, URL did not start with /api/daily-co-proxies',
      })
      return
    }

    const [_, orgSlugStr, destination] = urlMatch
    const orgSlug = OrgSlug.make(orgSlugStr)
    const runtime = makeRequestRuntime(
      Layer.mergeAll(OrgUserServiceLayer, DailyCoSecretLayerLive).pipe(
        Layer.provide(CurrentOrgLayerLive),
        Layer.provide(CurrentUserIdLayerLive)
      ),
      { request, orgSlug }
    )
    await runtime
      .runPromiseExit(dailycoEffect(request, destination))
      .then((exit) =>
        exit.pipe(
          Exit.match({
            onSuccess: ({ externalRes }) => {
              externalRes.body?.pipe(response.status(externalRes.status), {
                end: true,
              })
            },
            onFailure: (error) => {
              handleError(error, response)
            },
          })
        )
      )
  }
)
