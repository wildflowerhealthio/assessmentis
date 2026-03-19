import { Data, Effect, Exit, Layer } from 'effect'
import type { Response } from 'express'
import { onRequest } from 'firebase-functions/https'
import type { Request } from 'firebase-functions/https'
import * as logger from 'firebase-functions/logger'

import { DailyCoApiKeyLiveCredential } from '@assessmentis/daily-co-infrastructure'
import type {
  AuthError,
  AuthzError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  CurrentOrg,
  OrgSlug,
  OrgUserService,
  OrgUserServiceLayer,
} from '@assessmentis/platform-domain'
import type { DocumentStore } from '@assessmentis/platform-domain'

import fetch from 'node-fetch'
import type { Response as NodeFetchResponse } from 'node-fetch'
import type { ParsedQs } from 'qs'

import { CurrentOrgLayerLive } from '../layers/current-org-layer-live'
import { CurrentUserIdLayerLive } from '../layers/current-user-id-layer-live'
import { makeRequestRuntime } from '../util/base-layer'
import { defaultHttpOptions } from '../util/function-context'
import { handleError } from '../util/handle-error'

class DailyCoError extends Data.TaggedError('DailyCoError')<{
  message: string
  cause: unknown
}> {
  constructor(message: string, cause: unknown) {
    super({ cause, message })
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
): Effect.Effect<
  { externalRes: NodeFetchResponse },
  | DailyCoError
  | AuthError
  | AuthzError
  | BadDataError
  | NotFoundError<'Document', { path: readonly string[] }>
  | UnhandledError,
  OrgUserService | CurrentOrg | DocumentStore
> =>
  Effect.gen(function* dailycoEffectGen() {
    // Verify authentication
    const orgContext = yield* OrgUserService
    const rolesWithDailyCoAccess = ['admin', 'clinician'] as const
    yield* orgContext.ensureRole(rolesWithDailyCoAccess)

    const orgSlug = yield* CurrentOrg
    const secret = yield* DailyCoApiKeyLiveCredential.readOnce({ orgSlug })

    // Build Daily.co API URL
    const queryParams = new URLSearchParams(
      Object.entries(inbound.query).map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, value]
        }
        return [key, JSON.stringify(value)]
      })
    )
    const url = `https://api.daily.co/v1/${destination}?${queryParams.toString()}`

    // Prepare headers (filter out sensitive headers)
    const {
      host: _host,
      'set-cookie': _setCookie,
      authorization: _authorization,
      ...forwardedHeaders
    } = inbound.headers

    const headers = {
      ...forwardedHeaders,
      Authorization: `Bearer ${secret.apiKey}`,
      'Content-Type': 'application/json',
    }

    logger.info('Forwarding request to Daily.co API:', inbound.method, url)

    // Proxy request to Daily.co
    const externalRes = yield* Effect.tryPromise({
      catch: (error): DailyCoError =>
        new DailyCoError(`Failed to fetch from Daily.co: ${String(error)}`, error),
      try: () =>
        fetch(url, {
          headers,
          method: inbound.method,
          body: inbound.rawBody,
        }),
    })

    return { externalRes }
  })

const hasMinimumUrlCaptures = (
  value: null | string[]
): value is [string, string, string, ...string[]] => value !== null && value.length >= 3

export const dailyco = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    logger.info('Received request for Daily.co proxy:', request.method, request.path)

    // Extract org slug and destination from URL
    const urlMatch = request.path.match(/^\/api\/daily-co-proxies\/([^/]+)\/(.*)$/)

    if (!hasMinimumUrlCaptures(urlMatch)) {
      logger.error('Invalid URL')
      response.status(400).json({
        message: 'Bad Request, URL did not start with /api/daily-co-proxies',
      })
      return
    }

    const [_, orgSlugStr, destination] = urlMatch
    const orgSlug = OrgSlug.make(orgSlugStr)
    const runtime = makeRequestRuntime(
      Layer.mergeAll(OrgUserServiceLayer, CurrentOrgLayerLive).pipe(
        Layer.provide(CurrentOrgLayerLive),
        Layer.provide(CurrentUserIdLayerLive)
      ),
      { orgSlug, request }
    )
    await runtime.runPromiseExit(dailycoEffect(request, destination)).then((exit) => {
      exit.pipe(
        Exit.match({
          onFailure: (error) => {
            handleError(error, response)
          },
          onSuccess: ({ externalRes }) => {
            externalRes.body?.pipe(response.status(externalRes.status), {
              end: true,
            })
          },
        })
      )
    })
  }
)
