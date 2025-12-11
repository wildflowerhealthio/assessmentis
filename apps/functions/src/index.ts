import { onRequest } from 'firebase-functions/v2/https'
import { logger, setGlobalOptions } from 'firebase-functions/v2'
import type { Request } from 'firebase-functions/v2/https'
import { type Response } from 'express'
import fetch from 'node-fetch'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { error, info, warn } from 'firebase-functions/logger'

setGlobalOptions({ region: 'northamerica-northeast2' })

export const dailyco = onRequest(
  {
    timeoutSeconds: 60,
    ingressSettings: 'ALLOW_ALL',
    cors: [
      /^http:\/\/localhost$/,
      /assessment\.is$/,
      /assessment-is-sandbox\.web\.app$/,
      /assessment-is-sandbox--.*\.web\.app$/,
    ],
  },
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

    const app = initializeApp()

    const authHeader = request.headers['authorization']
    const authHeaderPrefix = 'Bearer '
    if (authHeader == undefined || !authHeader.startsWith(authHeaderPrefix)) {
      warn(
        'No authorization header, or invalid format. All Headers:',
        JSON.stringify(request.headers)
      )
      response.status(401).json({ message: 'Unauthorized' })
      return
    }
    const idToken = authHeader.slice(authHeaderPrefix.length)
    const uid = await getAuth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        const uid = decodedToken.uid
        info('Verified ID token for uid:', uid)
        return uid
      })
      .catch((error) => {
        warn('Error verifying ID token:', error)
        response.status(401).json({ message: 'Unauthorized' })
        return undefined
      })
    if (uid == undefined) return

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    const db = getFirestore(app, 'assessmentis-sandbox')
    info(
      'db',
      db.databaseId,
      'Collection Paths: ',
      (await db.listCollections()).map((col) => col.path)
    )
    const userValue: unknown = (
      await db.collection('users').doc(uid).get()
    ).data()

    if (userValue == null || typeof userValue !== 'object') {
      warn('User without a user record tried to access daily.co proxy:', uid)
      response.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (
      !('org_roles' in userValue) ||
      typeof userValue.org_roles != 'object' ||
      userValue.org_roles == null
    ) {
      error('User does not have an org_roles oject in their user document', uid)
      response.status(401).json({ message: 'Unauthorized' })
      return
    }
    const rolesByOrg = userValue.org_roles
    const getUnknownProp = (obj: object, key: string): unknown | undefined =>
      key in obj ? (obj as Record<string, unknown>)[key] : undefined

    const orgRoles = getUnknownProp(rolesByOrg, orgId)
    if (!Array.isArray(orgRoles)) {
      warn('User does not have configured roles for the organization', uid)
      response.status(401).json({ message: 'Unauthorized' })
      return
    }

    const usersOrgRoles: unknown[] = orgRoles
    const dailyCoRoleSet = new Set<unknown>(['admin', 'clinician'])
    if (!usersOrgRoles.some((role) => dailyCoRoleSet.has(role))) {
      warn('User does not have the a role allowing for daily co use', error)
      response.status(401).json({ message: 'Unauthorized' })
      return
    }
    const queryParams = new URLSearchParams(request.params).toString()
    const url = `https://api.daily.co/v1/${destination}/${queryParams}`
    const dailyApiKey = process.env.DAILY_API_KEY

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

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloworld = onRequest(
  { timeoutSeconds: 60, ingressSettings: 'ALLOW_ALL' },
  (_, response) => {
    logger.info('Hello logs!', { structuredData: true })
    response.status(200).send('Hello from Firebase!')
  }
)
