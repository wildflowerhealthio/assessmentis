import { Arbitrary, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { UserId } from '@assessmentis/platform-domain'

import { DailyCoProxyLiveCredential, DailyCoProxyToken } from './daily-co-proxy-live-credential'

const arb = Arbitrary.make(DailyCoProxyToken)

describe('DailyCoProxyToken', () => {
  const decode = Schema.decodeUnknownSync(DailyCoProxyToken)
  const encode = Schema.encodeSync(DailyCoProxyToken)

  const validPayload = {
    _tag: 'dailyco_proxy',
    authToken: 'token-123',
  }

  describe('DomainClass conformance', () => {
    test('has static DomainType', () => {
      expect(DailyCoProxyToken.DomainType).toBe('dailyco_proxy')
    })

    test('has static UrlSchema', () => {
      expect(DailyCoProxyToken.UrlSchema).toBeDefined()
    })

    test('has static SearchSchema', () => {
      expect(DailyCoProxyToken.SearchSchema).toEqual({})
    })

    test('decoded instance has domainType', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('dailyco_proxy')
    })

    test('domainType defaults when omitted from input', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('dailyco_proxy')
    })

    test('url is undefined when omitted', () => {
      const token = decode(validPayload)
      expect(token.url).toBeUndefined()
    })
  })

  describe('backward compatibility', () => {
    test('decodes Firestore payloads without domainType or url', () => {
      const firestorePayload = {
        _tag: 'dailyco_proxy',
        authToken: 'token-123',
      }
      const token = decode(firestorePayload)
      expect(token.domainType).toBe('dailyco_proxy')
      expect(token.url).toBeUndefined()
      expect(token.authToken).toBe('token-123')
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
      expect(invalidated.domainType).toBe('dailyco_proxy')
      expect(invalidated.authToken).toBe('')
    })
  })

  describe('fromAuthData', () => {
    test('produces a valid instance from auth data', () => {
      const token = DailyCoProxyLiveCredential.fromAuthData({
        authToken: 'auth-token-123',
        userId: UserId.make('user-123'),
      })
      expect(token.domainType).toBe('dailyco_proxy')
      expect(token.authToken).toBe('auth-token-123')
    })
  })

  describe('cloneWith', () => {
    test('produces a new instance with updated fields', () => {
      const token = decode(validPayload)
      const cloned = token.cloneWith({ authToken: 'cloned-token' })
      expect(cloned.authToken).toBe('cloned-token')
      expect(cloned.domainType).toBe('dailyco_proxy')
    })
  })
})
