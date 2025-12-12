import type { Response } from 'express'
import { onRequest, type Request } from 'firebase-functions/https'
import { info } from 'firebase-functions/logger'
import { db, defaultHttpOptions, oauth2Client } from '../util/context'
import { ensureAuthenticated } from '../util/auth'

export const refreshGoogleOAuthToken = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    info('Received request for Google OAuth login')
    const uid = await ensureAuthenticated(request, response)
    if (uid == undefined) return

    const tokenCollection = db.collection('users').doc(uid).collection('tokens')
    const refreshTokenDoc = await tokenCollection
      .doc('googleOAuthRefreshToken')
      .get()

    if (!refreshTokenDoc.exists) {
      response.status(400).send('Missing refresh token, please login')
      return
    }
    const refreshToken = refreshTokenDoc.data()!

    oauth2Client.setCredentials({
      refresh_token: refreshToken.token,
    })
    const refreshTokenResponse = await oauth2Client.refreshAccessToken()

    const { access_token, expiry_date, scope, token_type } =
      refreshTokenResponse.credentials

    const setAccessToken = tokenCollection.doc('googleOAuthAccessToken').set({
      lastUpdated: new Date(),
      scope,
      tokenType: token_type,
      token: access_token,
      expiresAt: expiry_date ? new Date(expiry_date) : undefined,
      credentials: refreshTokenResponse.credentials,
    })

    await setAccessToken
    response.status(200).send('{}')
    return
  }
)
