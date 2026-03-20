import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { OrgSlug, UserId } from '@assessmentis/platform-domain'

import { FirebasePlatformRoutes } from './firebase-platform-routes'

const routes = new FirebasePlatformRoutes({
  projectId: 'my-project',
  databaseId: 'my-db',
})

describe('FirebasePlatformRoutes', () => {
  test('documentBaseUrl uses firebase:// scheme with firestore path', () => {
    expect(routes.documentBaseUrl.protocol).toBe('firebase:')
    expect(routes.documentBaseUrl.host).toBe('my-project')
    expect(routes.documentBaseUrl.pathname).toBe('/firestore/my-db')
  })

  test('authBaseUrl uses firebase:// scheme with auth path', () => {
    expect(routes.authBaseUrl.protocol).toBe('firebase:')
    expect(routes.authBaseUrl.host).toBe('my-project')
    expect(routes.authBaseUrl.pathname).toBe('/auth/currentUser')
  })

  test('orgUrl produces correct firebase URL', () => {
    const url = routes.orgUrl(OrgSlug.make('acme'))
    expect(url.toString()).toContain('firebase://my-project/firestore/my-db/orgs/acme')
  })

  test('round-trip orgUrl → orgSlugFromUrl', () => {
    const slug = OrgSlug.make('acme')
    const url = routes.orgUrl(slug)
    const extracted = Effect.runSync(routes.orgSlugFromUrl(url))
    expect(extracted).toBe(slug)
  })

  test('round-trip userOrgUrl → userIdFromUserOrgUrl + orgSlugFromUserOrgUrl', () => {
    const uid = UserId.make('user-123')
    const slug = OrgSlug.make('acme')
    const url = routes.userOrgUrl(uid, slug)
    expect(Effect.runSync(routes.userIdFromUserOrgUrl(url))).toBe(uid)
    expect(Effect.runSync(routes.orgSlugFromUserOrgUrl(url))).toBe(slug)
  })

  test('document and auth base URLs are not children of each other', () => {
    expect(routes.documentBaseUrl.hasChild(routes.authBaseUrl)).toBe(false)
    expect(routes.authBaseUrl.hasChild(routes.documentBaseUrl)).toBe(false)
  })
})
