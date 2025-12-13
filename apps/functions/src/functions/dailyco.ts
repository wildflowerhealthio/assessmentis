import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { info, error } from 'firebase-functions/logger'
import fetch from 'node-fetch'
import { ensureAuthenticated, makeUserOrgRoleValidator } from '../util/auth'
import { app, db, defaultHttpOptions } from '../util/context'

export const dailyco = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for Daily.co proxy:', request.method, request.path)

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
    const [_, orgId, destination] = urlMatch

    const uid = await ensureAuthenticated(request, response)
    if (uid == undefined) return
    const rolesWithDailyCoAccess = ['admin', 'clinician'] as const
    const shouldHaveDailyCoAccess = makeUserOrgRoleValidator(
      app,
      rolesWithDailyCoAccess
    )
    if (!(await shouldHaveDailyCoAccess(uid, orgId, response))) return

    const queryParams = new URLSearchParams(
      Object.entries(request.query).map(([key, value]) => [key, String(value)])
    )
    const url = `https://api.daily.co/v1/${destination}?${queryParams}`

    const dailyCoSecretsDoc = await db
      .collection('orgs')
      .doc(orgId)
      .collection('secrets')
      .doc('dailyCo')
      .get()

    const dailyApiKey = dailyCoSecretsDoc.data()?.apiKey

    if (!dailyApiKey) {
      response.status(500).json({
        message: 'No API Key',
      })
      return
    }

    const {
      host: _host,
      'set-cookie': _setCookie,
      authorization: _authorization,
      ...forwardedHeaders
    } = request.headers

    const headers = {
      ...forwardedHeaders,
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + dailyApiKey,
    } as const

    info('Forwarding request to Daily.co API:', request.method, url)

    const externalRes = await fetch(url, {
      headers,
      method: request.method,
      body: request.rawBody,
    })
    externalRes.body?.pipe(response.status(externalRes.status), { end: true })
  }
)
