import { Arbitrary, DateTime, Option, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { GoogleUserOAuthToken } from './google-user-o-auth'

const arb = Arbitrary.make(GoogleUserOAuthToken)

describe('GoogleUserOAuthToken', () => {
  const decode = Schema.decodeUnknownSync(GoogleUserOAuthToken)
  const encode = Schema.encodeSync(GoogleUserOAuthToken)

  const validPayload = {
    _tag: 'google_user_oauth_token',
    accessToken: 'access-123',
    email: 'user@example.com',
    expiresAt: { seconds: 1700000000, nanoseconds: 0 },
    scope: 'openid email',
  }

  describe('DomainClass conformance', () => {
    test('has static DomainType', () => {
      expect(GoogleUserOAuthToken.DomainType).toBe('google_user_oauth_token')
    })

    test('has static UrlSchema', () => {
      expect(GoogleUserOAuthToken.UrlSchema).toBeDefined()
    })

    test('has static SearchSchema', () => {
      expect(GoogleUserOAuthToken.SearchSchema).toEqual({})
    })

    test('decoded instance has domainType', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('google_user_oauth_token')
    })

    test('domainType defaults when omitted from input', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('google_user_oauth_token')
    })

    test('url is undefined when omitted', () => {
      const token = decode(validPayload)
      expect(token.url).toBeUndefined()
    })
  })

  describe('backward compatibility', () => {
    test('decodes Firestore payloads without domainType or url', () => {
      const firestorePayload = {
        _tag: 'google_user_oauth_token',
        accessToken: 'access-123',
        email: 'user@example.com',
        expiresAt: { seconds: 1700000000, nanoseconds: 0 },
        scope: 'openid email',
      }
      const token = decode(firestorePayload)
      expect(token.domainType).toBe('google_user_oauth_token')
      expect(token.url).toBeUndefined()
      expect(token.accessToken).toBe('access-123')
    })
  })

  describe('roundtrip', () => {
    test('property: encode-decode round-trip preserves value', () => {
      fc.assert(
        fc.property(arb, (token) => {
          const encoded = encode(token)
          const decoded = decode(encoded)
          const reEncoded = encode(decoded)
          expect(reEncoded).toEqual(encoded)
        })
      )
    })
  })

  describe('asInvalidated', () => {
    test('produces a valid instance with correct domainType', () => {
      const token = decode(validPayload)
      const invalidated = token.asInvalidated()
      expect(invalidated.domainType).toBe('google_user_oauth_token')
      expect(invalidated.accessToken).toBe('')
      expect(invalidated.refreshToken).toEqual(Option.none())
    })
  })

  describe('withRefreshedAccess', () => {
    test('produces a valid instance with correct domainType', () => {
      const token = decode(validPayload)
      const newExpiry = DateTime.toUtc(DateTime.unsafeMake(Date.now() + 3600_000))
      const refreshed = token.withRefreshedAccess('new-access', newExpiry)
      expect(refreshed.domainType).toBe('google_user_oauth_token')
      expect(refreshed.accessToken).toBe('new-access')
      expect(refreshed.email).toBe('user@example.com')
    })
  })

  describe('cloneWith', () => {
    test('produces a new instance with updated fields', () => {
      const token = decode(validPayload)
      const cloned = token.cloneWith({ accessToken: 'cloned-access' })
      expect(cloned.accessToken).toBe('cloned-access')
      expect(cloned.email).toBe(token.email)
      expect(cloned.domainType).toBe('google_user_oauth_token')
    })
  })
})
