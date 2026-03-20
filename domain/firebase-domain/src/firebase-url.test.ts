import { describe, expect, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { buildAuthBaseUrl, buildFirestoreBaseUrl } from './firebase-url'
import type { FirebaseUrlConfig } from './firebase-url'

const config: FirebaseUrlConfig = {
  projectId: 'my-project',
  databaseId: 'my-db',
}

describe('buildFirestoreBaseUrl', () => {
  test('produces a firebase:// URL with the project as host', () => {
    const url = buildFirestoreBaseUrl(config)
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
  })

  test('includes the database ID in the pathname', () => {
    const url = buildFirestoreBaseUrl(config)
    expect(url.pathname).toBe('/firestore/my-db')
  })

  test('supports ReadonlyUrl.hasChild for document paths', () => {
    const base = buildFirestoreBaseUrl(config)
    const child = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'my-project',
      pathname: '/firestore/my-db/orgs/acme',
    })
    expect(base.hasChild(child)).toBe(true)
  })

  test('different projects are not children of each other', () => {
    const base = buildFirestoreBaseUrl(config)
    const other = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'other-project',
      pathname: '/firestore/my-db/orgs/acme',
    })
    expect(base.hasChild(other)).toBe(false)
  })

  test('different databases are not children of each other', () => {
    const base = buildFirestoreBaseUrl(config)
    const other = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'my-project',
      pathname: '/firestore/other-db/orgs/acme',
    })
    expect(base.hasChild(other)).toBe(false)
  })
})

describe('buildAuthBaseUrl', () => {
  test('produces a firebase:// URL with auth/currentUser pathname', () => {
    const url = buildAuthBaseUrl('my-project')
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
    expect(url.pathname).toBe('/auth/currentUser')
  })

  test('auth URL is not a child of the firestore URL', () => {
    const firestoreBase = buildFirestoreBaseUrl(config)
    const authBase = buildAuthBaseUrl(config.projectId)
    expect(firestoreBase.hasChild(authBase)).toBe(false)
  })

  test('firestore URL is not a child of the auth URL', () => {
    const firestoreBase = buildFirestoreBaseUrl(config)
    const authBase = buildAuthBaseUrl(config.projectId)
    expect(authBase.hasChild(firestoreBase)).toBe(false)
  })

  test('auth credential URL is a child of the auth base', () => {
    const authBase = buildAuthBaseUrl('my-project')
    const credential = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'my-project',
      pathname: '/auth/currentUser/DailyCoProxyToken',
    })
    expect(authBase.hasChild(credential)).toBe(true)
  })
})
