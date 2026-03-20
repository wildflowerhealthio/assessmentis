import { describe, expect, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { buildFirebaseBaseUrl } from './firebase-url'
import type { FirebaseUrlConfig } from './firebase-url'

const config: FirebaseUrlConfig = {
  projectId: 'my-project',
  databaseId: 'my-db',
}

describe('buildFirebaseBaseUrl', () => {
  test('produces a firebase:// URL with the project as host', () => {
    const url = buildFirebaseBaseUrl(config)
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
  })

  test('includes the database ID in the pathname', () => {
    const url = buildFirebaseBaseUrl(config)
    expect(url.pathname).toBe('/firestore/my-db')
  })

  test('supports ReadonlyUrl.hasChild for document paths', () => {
    const base = buildFirebaseBaseUrl(config)
    const child = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'my-project',
      pathname: '/firestore/my-db/orgs/acme',
    })
    expect(base.hasChild(child)).toBe(true)
  })

  test('different projects are not children of each other', () => {
    const base = buildFirebaseBaseUrl(config)
    const other = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'other-project',
      pathname: '/firestore/my-db/orgs/acme',
    })
    expect(base.hasChild(other)).toBe(false)
  })

  test('different databases are not children of each other', () => {
    const base = buildFirebaseBaseUrl(config)
    const other = ReadonlyUrl.make({
      protocol: 'firebase:',
      host: 'my-project',
      pathname: '/firestore/other-db/orgs/acme',
    })
    expect(base.hasChild(other)).toBe(false)
  })
})
