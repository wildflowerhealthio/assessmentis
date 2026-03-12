import { describe, expect, test } from 'vitest'
import { Arbitrary, FastCheck as fc, Schema } from 'effect'

import { BaseOriginDefinition } from './BaseOriginDefinition'

const baseOriginArb = Arbitrary.make(BaseOriginDefinition)

describe('BaseOriginDefinition', () => {
  const decode = Schema.decodeUnknownSync(BaseOriginDefinition)
  const decodeEither = Schema.decodeUnknownEither(BaseOriginDefinition)
  const encode = Schema.encodeSync(BaseOriginDefinition)

  describe('roundtrip', () => {
    test('property: encode-decode round-trip preserves value', () => {
      fc.assert(
        fc.property(baseOriginArb, (value) => {
          const encoded = encode(value)
          const decoded = decode(encoded)
          expect(decoded).toEqual(value)
        })
      )
    })
  })

  describe('rejects invalid inputs', () => {
    test('rejects missing _tag', () => {
      const result = decodeEither({ supportedResources: {} })
      expect(result._tag).toBe('Left')
    })

    test('rejects non-string _tag', () => {
      const result = decodeEither({ _tag: 42, supportedResources: {} })
      expect(result._tag).toBe('Left')
    })

    test('rejects supportedResources with non-true values', () => {
      const result = decodeEither({
        _tag: 'TestOrigin',
        supportedResources: { Patient: false },
      })
      expect(result._tag).toBe('Left')
    })

    test('rejects supportedResources with string values', () => {
      const result = decodeEither({
        _tag: 'TestOrigin',
        supportedResources: { Patient: 'yes' },
      })
      expect(result._tag).toBe('Left')
    })

    test('rejects non-object supportedResources', () => {
      const result = decodeEither({
        _tag: 'TestOrigin',
        supportedResources: 'invalid',
      })
      expect(result._tag).toBe('Left')
    })

    test('rejects missing supportedResources', () => {
      const result = decodeEither({ _tag: 'TestOrigin' })
      expect(result._tag).toBe('Left')
    })
  })

  describe('onExcessProperty: preserve', () => {
    test('extra fields survive decode', () => {
      const input = {
        _tag: 'TestOrigin',
        supportedResources: { Patient: true },
        customField: 'extra-value',
        nested: { deep: 123 },
      }
      const decoded = decode(input)
      expect(decoded._tag).toBe('TestOrigin')
      expect(decoded.supportedResources).toEqual({ Patient: true })
      expect(decoded).toHaveProperty('customField', 'extra-value')
      expect(decoded).toHaveProperty('nested', { deep: 123 })
    })

    test('decodes valid input with no extra fields', () => {
      const input = {
        _tag: 'TestOrigin',
        supportedResources: { Patient: true, Observation: true },
      }
      const decoded = decode(input)
      expect(decoded._tag).toBe('TestOrigin')
      expect(decoded.supportedResources).toEqual({
        Patient: true,
        Observation: true,
      })
    })

    test('extra fields survive encode-decode round-trip', () => {
      const input = {
        _tag: 'TestOrigin',
        supportedResources: {},
        oauthConfig: { clientId: 'abc' },
      }
      const decoded = decode(input)
      const encoded = encode(decoded)
      const reDecoded = decode(encoded)
      expect(reDecoded).toHaveProperty('oauthConfig', { clientId: 'abc' })
    })
  })

  describe('accepts valid inputs', () => {
    test('accepts empty supportedResources', () => {
      const result = decodeEither({
        _tag: 'TestOrigin',
        supportedResources: {},
      })
      expect(result._tag).toBe('Right')
    })

    test('accepts multiple active resources', () => {
      const decoded = decode({
        _tag: 'FhirOrigin',
        supportedResources: {
          Patient: true,
          Observation: true,
          Encounter: true,
        },
      })
      expect(Object.keys(decoded.supportedResources)).toHaveLength(3)
    })
  })
})
