import { type Request } from 'firebase-functions/v2/https'
import { type Response } from 'express'
import { info, warn, error } from 'firebase-functions/logger'
import { type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { db } from './context'

export const ensureAuthenticated = async (
  request: Request,
  response: Response
): Promise<string | undefined> => {
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
  return uid
}

export const makeUserOrgRoleValidator =
  (app: App, roles: ReadonlyArray<string>) =>
  async (uid: string, orgId: string, response: Response) => {
    const dailyCoRoleSet = new Set<unknown>(roles)

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    info(
      'db',
      db.databaseId,
      'Collection Paths: ',
      (await db.listCollections()).map((col) => col.path)
    )
    const userValue: unknown = (
      await db.collection('orgs').doc(orgId).collection('users').doc(uid).get()
    ).data()

    if (userValue == null || typeof userValue !== 'object') {
      warn('User without a user record tried to access daily.co proxy:', uid)
      response.status(401).json({ message: 'Unauthorized' })
      return false
    }

    if (!('roles' in userValue && Array.isArray(userValue.roles))) {
      error('User does not have an roles oject in their user document', uid)
      response.status(401).json({ message: 'Unauthorized' })
      return false
    }

    const usersOrgRoles: unknown[] = userValue.roles
    if (!usersOrgRoles.some((role) => dailyCoRoleSet.has(role))) {
      warn('User does not have the a role allowing for daily co use', error)
      response.status(401).json({ message: 'Unauthorized' })
      return false
    }

    return true
  }
