import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { info, error } from 'firebase-functions/logger'
import { defaultHttpOptions, oauth2Client, scopes } from '../util/context'
import { ensureAuthenticated } from '../util/auth'

export const googleLogin = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for Google OAuth login')
    const uid = await ensureAuthenticated(request, response)
    if (uid == undefined) return

    // const userToken = (await db.collection('userTokens').doc(uid).get()).data()

    try {
      const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true,
        prompt: 'consent',
        state: JSON.stringify({ uid, hostname: request.hostname }),
      })
      response.set('Cache-Control', 'private, max-age=0, s-maxage=0')
      response.send({ url: authorizationUrl })
    } catch (err) {
      error('Error during Google OAuth login:', err)
      response.status(400).send({ error: err })
    }
  }
)
