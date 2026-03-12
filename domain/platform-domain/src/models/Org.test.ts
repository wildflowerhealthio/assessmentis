import { describe, expect, test } from 'vitest'
import { Arbitrary, FastCheck as fc, Schema } from 'effect'

import { Org } from './Org'
import { OrgSlug } from './IdTypes'

const orgArb = Arbitrary.make(Org)

describe('Org', () => {
  const decode = Schema.decodeUnknownSync(Org)
  const decodeEither = Schema.decodeUnknownEither(Org)
  const encode = Schema.encodeSync(Org)

  describe('roundtrip', () => {
    test('property: encode-decode round-trip preserves value (no timestamps)', () => {
      const localDecode = Schema.decodeUnknownSync(Org)
      const localEncode = Schema.encodeSync(Org)
      fc.assert(
        fc.property(orgArb, (org) => {
          const encoded = localEncode(org)
          const decoded = localDecode(encoded)
          expect(decoded).toEqual(org)
        })
      )
    })

    test('roundtrip with realistic timestamps', () => {
      const input = {
        slug: 'test-org',
        emoji: '🏥',
        lastRecordingSyncTimestamp: {
          seconds: 1700000000,
          nanoseconds: 123000000,
        },
        lastTranscriptSyncTimestamp: { seconds: 1600000000, nanoseconds: 0 },
      }
      const decoded = decode(input)
      const encoded = encode(decoded)
      const reDecoded = decode(encoded)
      const reEncoded = encode(reDecoded)
      expect(reEncoded).toEqual(encoded)
    })
  })

  describe('required fields', () => {
    test('rejects missing slug', () => {
      const result = decodeEither({ emoji: '🏥' })
      expect(result._tag).toBe('Left')
    })

    test('rejects missing emoji', () => {
      const result = decodeEither({ slug: 'test-org' })
      expect(result._tag).toBe('Left')
    })

    test('rejects non-string slug', () => {
      const result = decodeEither({ slug: 123, emoji: '🏥' })
      expect(result._tag).toBe('Left')
    })

    test('rejects non-string emoji', () => {
      const result = decodeEither({ slug: 'test-org', emoji: 42 })
      expect(result._tag).toBe('Left')
    })

    test('rejects empty input', () => {
      const result = decodeEither({})
      expect(result._tag).toBe('Left')
    })
  })

  describe('optional fields default correctly', () => {
    test('origins defaults to empty object when omitted', () => {
      const result = decode({ slug: 'test-org', emoji: '🏥' })
      expect(result.origins).toEqual({})
    })

    test('originConfigs defaults to empty object when omitted', () => {
      const result = decode({ slug: 'test-org', emoji: '🏥' })
      expect(result.originConfigs).toEqual({})
    })

    test('lastRecordingSyncTimestamp is undefined when omitted', () => {
      const result = decode({ slug: 'test-org', emoji: '🏥' })
      expect(result.lastRecordingSyncTimestamp).toBeUndefined()
    })

    test('lastTranscriptSyncTimestamp is undefined when omitted', () => {
      const result = decode({ slug: 'test-org', emoji: '🏥' })
      expect(result.lastTranscriptSyncTimestamp).toBeUndefined()
    })

    test('lastSyncError is undefined when omitted', () => {
      const result = decode({ slug: 'test-org', emoji: '🏥' })
      expect(result.lastSyncError).toBeUndefined()
    })
  })

  describe('origins field', () => {
    test('accepts valid origins record', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        origins: {
          'https%3A%2F%2Fexample.com%2Ffhir': {
            _tag: 'FhirOrigin',
            supportedResources: { Patient: true },
          },
        },
      })
      expect(Object.keys(result.origins)).toHaveLength(1)
    })

    test('rejects origins with invalid BaseOriginDefinition values', () => {
      const result = decodeEither({
        slug: 'test-org',
        emoji: '🏥',
        origins: {
          'https%3A%2F%2Fexample.com': { missing_tag: 'bad' },
        },
      })
      expect(result._tag).toBe('Left')
    })

    test('accepts empty origins record', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        origins: {},
      })
      expect(result.origins).toEqual({})
    })

    test('preserves extra fields on BaseOriginDefinition within origins', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        origins: {
          'https%3A%2F%2Fexample.com%2Ffhir': {
            _tag: 'FhirOrigin',
            supportedResources: { Patient: true },
            serverUrl: 'https://example.com/fhir',
          },
        },
      })
      const origins = Object.values(result.origins)
      expect(origins).toHaveLength(1)
      expect(origins[0]).toHaveProperty('serverUrl', 'https://example.com/fhir')
    })
  })

  describe('optional timestamp fields', () => {
    test('accepts lastRecordingSyncTimestamp as Firebase timestamp', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        lastRecordingSyncTimestamp: { seconds: 1700000000, nanoseconds: 0 },
      })
      expect(result.lastRecordingSyncTimestamp).toBeDefined()
    })

    test('accepts lastTranscriptSyncTimestamp as Firebase timestamp', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        lastTranscriptSyncTimestamp: { seconds: 1700000000, nanoseconds: 0 },
      })
      expect(result.lastTranscriptSyncTimestamp).toBeDefined()
    })

    test('accepts lastSyncError as string', () => {
      const result = decode({
        slug: 'test-org',
        emoji: '🏥',
        lastSyncError: 'Connection refused',
      })
      expect(result.lastSyncError).toBe('Connection refused')
    })

    test('rejects lastSyncError as non-string', () => {
      const result = decodeEither({
        slug: 'test-org',
        emoji: '🏥',
        lastSyncError: 42,
      })
      expect(result._tag).toBe('Left')
    })
  })

  describe('slug is branded OrgSlug', () => {
    test('property: decoded slug is a valid OrgSlug', () => {
      const slugArb = Arbitrary.make(OrgSlug)
      fc.assert(
        fc.property(slugArb, fc.string(), (slug, emoji) => {
          const result = decode({
            slug: slug,
            emoji,
          })
          expect(result.slug).toBe(slug)
        })
      )
    })
  })
})
