import { onRequest } from 'firebase-functions/v2/https'
import type { Request } from 'firebase-functions/v2/https'
import { type Response } from 'express'
import { google } from 'googleapis'
import { info, error } from 'firebase-functions/logger'
import { db, defaultHttpOptions, oauth2Client } from '../util/context'

export const oAuthCallback = onRequest(
  defaultHttpOptions,
  async (request: Request, response: Response) => {
    const q = request.query

    info('Received OAuth callback with query params:', q)
    if (q.error) {
      // An error response e.g. error=access_denied
      error('Error:' + q.error)
    } else {
      // Get access and refresh tokens (if access_type is offline)
      const { tokens } = await oauth2Client.getToken(q.code?.toString() ?? '')
      oauth2Client.setCredentials(tokens)
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
      })
      const { uid, hostname } = JSON.parse(q.state?.toString() ?? '{}')
      const { data } = await oauth2.userinfo.get()
      const { email } = data
      const { refresh_token, id_token, access_token, ...getTokenExtra } = tokens
      if (!(access_token && refresh_token && id_token && email && uid)) {
        response.status(400).send('Missing required tokens or email')
        return
      }

      const res = await oauth2.tokeninfo({
        access_token: access_token,
        id_token: id_token,
      })

      const tokenMetadata = {
        email,
        lastUpdated: new Date(),
        scope: tokens.scope,
        tokenType: tokens.token_type,
      }

      let success = false
      if (res.data.scope) {
        // Store the refresh token in the Firestore database.
        try {
          const refreshTokenExpiresInSeconds =
            'expires_in' in res.data && typeof res.data.expires_in == 'number'
              ? res.data.expires_in
              : undefined
          const tokenCollection = db
            .collection('users')
            .doc(uid)
            .collection('tokens')
          const setAccessToken = tokenCollection
            .doc('googleOAuthAccessToken')
            .set({
              ...tokenMetadata,
              token: tokens.access_token,
              expiresAt: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : undefined,
            })

          const setRefreshToken = tokenCollection
            .doc('googleOAuthRefreshToken')
            .set({
              ...tokenMetadata,
              token: tokens.refresh_token,
              expiresAt: refreshTokenExpiresInSeconds
                ? new Date(Date.now() + refreshTokenExpiresInSeconds * 1000)
                : undefined,
              tokeninfo: res.data,
              getTokenExtra,
            })

          info(
            'Stored refresh token in Firestore',
            Promise.all([setAccessToken, setRefreshToken])
          )
          success = true
        } catch (err) {
          error('Error storing refresh token in Firestore:', err)
          success = false
        }
      }
      const redirectUrl = `https://${hostname}/authorizeEmail?email=${email}&success=${success}`
      response.redirect(redirectUrl)
    }
  }
)
