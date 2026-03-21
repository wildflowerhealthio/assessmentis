import { Arbitrary, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { DailyCoApiKeyToken } from './daily-co-api-key-live-credential'

const arb = Arbitrary.make(DailyCoApiKeyToken)

describe('DailyCoApiKeyToken', () => {
  const decode = Schema.decodeUnknownSync(DailyCoApiKeyToken)
  const encode = Schema.encodeSync(DailyCoApiKeyToken)

  const validPayload = {
    _tag: 'dailyco_api_key',
    apiKey: 'key-123',
  }

  describe('DomainClass conformance', () => {
    test('has static DomainType', () => {
      expect(DailyCoApiKeyToken.DomainType).toBe('dailyco_api_key')
    })

    test('has static UrlSchema', () => {
      expect(DailyCoApiKeyToken.UrlSchema).toBeDefined()
    })

    test('has static SearchSchema', () => {
      expect(DailyCoApiKeyToken.SearchSchema).toEqual({})
    })

    test('decoded instance has domainType', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('dailyco_api_key')
    })

    test('domainType defaults when omitted from input', () => {
      const token = decode(validPayload)
      expect(token.domainType).toBe('dailyco_api_key')
    })

    test('url is undefined when omitted', () => {
      const token = decode(validPayload)
      expect(token.url).toBeUndefined()
    })
  })

  describe('backward compatibility', () => {
    test('decodes Firestore payloads without domainType or url', () => {
      const firestorePayload = {
        _tag: 'dailyco_api_key',
        apiKey: 'key-123',
      }
      const token = decode(firestorePayload)
      expect(token.domainType).toBe('dailyco_api_key')
      expect(token.url).toBeUndefined()
      expect(token.apiKey).toBe('key-123')
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
      expect(invalidated.domainType).toBe('dailyco_api_key')
      expect(invalidated.apiKey).toBe('')
    })
  })

  describe('cloneWith', () => {
    test('produces a new instance with updated fields', () => {
      const token = decode(validPayload)
      const cloned = token.cloneWith({ apiKey: 'cloned-key' })
      expect(cloned.apiKey).toBe('cloned-key')
      expect(cloned.domainType).toBe('dailyco_api_key')
    })
  })
})
