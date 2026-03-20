import { describe, expect, test } from 'vitest'

import {
  authCredentialUrl,
  serverCredentialUrl,
  userCredentialUrl,
} from './firebase-credential-urls'
import { buildAuthBaseUrl, buildFirestoreBaseUrl } from './firebase-url'
import type { FirebaseUrlConfig } from './firebase-url'

const config: FirebaseUrlConfig = {
  projectId: 'my-project',
  databaseId: 'my-db',
}

describe('userCredentialUrl', () => {
  test('produces a firebase:// URL under users/{userId}/credentials/', () => {
    const url = userCredentialUrl(config, 'user-123', 'google_user_oauth_token:user@example.com')
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
    expect(url.pathname).toBe(
      '/firestore/my-db/users/user-123/credentials/google_user_oauth_token:user@example.com'
    )
  })

  test('is a child of the firestore base URL', () => {
    const base = buildFirestoreBaseUrl(config)
    const url = userCredentialUrl(config, 'user-123', 'cred-id')
    expect(base.hasChild(url)).toBe(true)
  })

  test('is not a child of the auth base URL', () => {
    const authBase = buildAuthBaseUrl(config.projectId)
    const url = userCredentialUrl(config, 'user-123', 'cred-id')
    expect(authBase.hasChild(url)).toBe(false)
  })
})

describe('serverCredentialUrl', () => {
  test('produces a firebase:// URL under orgs/{orgSlug}/credentials/', () => {
    const url = serverCredentialUrl(config, 'acme', 'dailyco')
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
    expect(url.pathname).toBe('/firestore/my-db/orgs/acme/credentials/dailyco')
  })

  test('is a child of the firestore base URL', () => {
    const base = buildFirestoreBaseUrl(config)
    const url = serverCredentialUrl(config, 'acme', 'dailyco')
    expect(base.hasChild(url)).toBe(true)
  })

  test('is not a child of the auth base URL', () => {
    const authBase = buildAuthBaseUrl(config.projectId)
    const url = serverCredentialUrl(config, 'acme', 'dailyco')
    expect(authBase.hasChild(url)).toBe(false)
  })
})

describe('authCredentialUrl', () => {
  test('produces a firebase:// URL under auth/currentUser/', () => {
    const url = authCredentialUrl('my-project', 'DailyCoProxyToken')
    expect(url.protocol).toBe('firebase:')
    expect(url.host).toBe('my-project')
    expect(url.pathname).toBe('/auth/currentUser/DailyCoProxyToken')
  })

  test('is a child of the auth base URL', () => {
    const authBase = buildAuthBaseUrl('my-project')
    const url = authCredentialUrl('my-project', 'DailyCoProxyToken')
    expect(authBase.hasChild(url)).toBe(true)
  })

  test('is not a child of the firestore base URL', () => {
    const firestoreBase = buildFirestoreBaseUrl(config)
    const url = authCredentialUrl('my-project', 'DailyCoProxyToken')
    expect(firestoreBase.hasChild(url)).toBe(false)
  })
})

describe('cross-category isolation', () => {
  test('user credential URL is not a child of server credential URL', () => {
    const serverUrl = serverCredentialUrl(config, 'acme', 'dailyco')
    const userUrl = userCredentialUrl(config, 'user-123', 'cred-id')
    expect(serverUrl.hasChild(userUrl)).toBe(false)
  })

  test('auth credential URL is not a child of firestore credential URLs', () => {
    const authUrl = authCredentialUrl('my-project', 'DailyCoProxyToken')
    const userUrl = userCredentialUrl(config, 'user-123', 'cred-id')
    const serverUrl = serverCredentialUrl(config, 'acme', 'dailyco')
    expect(userUrl.hasChild(authUrl)).toBe(false)
    expect(serverUrl.hasChild(authUrl)).toBe(false)
  })
})
