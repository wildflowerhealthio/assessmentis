import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { Datatype, DatatypeChoice } from './Datatype'

// ---------------------------------------------------------------------------
// DatatypeChoice — tagged union factory
// ---------------------------------------------------------------------------

describe('DatatypeChoice', () => {
  const ValueChoice = DatatypeChoice(['string', 'boolean', 'integer'])
  const decode = Schema.decodeSync(ValueChoice)
  const decodeUnknown = Schema.decodeUnknownSync(ValueChoice)
  const encode = Schema.encodeSync(ValueChoice)

  describe('schema structure', () => {
    test('decodes a tagged string variant', () => {
      const result = decode({ _tag: 'string', string: 'hello' })
      expect(result).toEqual({ _tag: 'string', string: 'hello' })
    })

    test('decodes a tagged boolean variant', () => {
      const result = decode({ _tag: 'boolean', boolean: true })
      expect(result).toEqual({ _tag: 'boolean', boolean: true })
    })

    test('decodes a tagged integer variant', () => {
      const result = decode({ _tag: 'integer', integer: 42 })
      expect(result).toEqual({ _tag: 'integer', integer: 42 })
    })

    test('rejects unknown _tag', () => {
      expect(() => decodeUnknown({ _tag: 'Quantity', Quantity: 1 })).toThrow()
    })

    test('rejects missing _tag', () => {
      expect(() => decodeUnknown({ string: 'hello' })).toThrow()
    })
  })

  describe('round-trip encode/decode', () => {
    test('property: encode ∘ decode is identity', () => {
      const arb = Arbitrary.make(ValueChoice)
      fc.assert(
        fc.property(arb, (value) => {
          const encoded = encode(value)
          const decoded = decode(encoded)
          expect(decoded).toEqual(value)
        })
      )
    })
  })

  describe('arbitrary generation', () => {
    test('property: every generated value has exactly one _tag from the allowed set', () => {
      const allowedTags = new Set(['string', 'boolean', 'integer'])
      const arb = Arbitrary.make(ValueChoice)
      fc.assert(
        fc.property(arb, (value) => {
          expect(allowedTags.has(value._tag)).toBe(true)
          // Verify the variant carries its named field
          switch (value._tag) {
            case 'string':
              expect(value.string).toBeDefined()
              break
            case 'boolean':
              expect(value.boolean).toBeDefined()
              break
            case 'integer':
              expect(value.integer).toBeDefined()
              break
          }
        })
      )
    })
  })

  describe('type narrowing', () => {
    test('_tag narrows to specific variant', () => {
      const value = decode({ _tag: 'string', string: 'test' })
      if (value._tag === 'string') {
        // TypeScript narrows this — accessing .string is type-safe
        expect(value.string).toBe('test')
      }
    })
  })

  describe('as Schema.optional field', () => {
    const ResourceSchema = Schema.Struct({
      value: Schema.optional(ValueChoice),
      name: Schema.String,
    })
    const decodeResource = Schema.decodeSync(ResourceSchema)

    test('decodes with value present', () => {
      const result = decodeResource({
        name: 'test',
        value: { _tag: 'integer', integer: 99 },
      })
      expect(result.value).toEqual({ _tag: 'integer', integer: 99 })
    })

    test('decodes with value absent', () => {
      const result = decodeResource({ name: 'test' })
      expect(result.value).toBeUndefined()
    })

    test('property: arbitrary generates valid optional values', () => {
      const arb = Arbitrary.make(ResourceSchema)
      fc.assert(
        fc.property(arb, (resource) => {
          expect(resource.name).toBeTypeOf('string')
          if (resource.value !== undefined) {
            expect(resource.value._tag).toBeTypeOf('string')
          }
        })
      )
    })
  })
})

// ---------------------------------------------------------------------------
// DatatypeChoice with overrideFields
// ---------------------------------------------------------------------------

describe('DatatypeChoice with overrideFields', () => {
  const CustomStringSchema = Schema.String.pipe(
    Schema.minLength(1),
    Schema.maxLength(10)
  )
  const CustomStringDatatype = Datatype('string', CustomStringSchema)

  const ChoiceWithOverride = DatatypeChoice(
    ['string', 'boolean'],
    [CustomStringDatatype]
  )
  const decode = Schema.decodeSync(ChoiceWithOverride)

  test('override schema is used for the specified type', () => {
    // Valid: string within 1-10 chars
    expect(() => decode({ _tag: 'string', string: 'hello' })).not.toThrow()
    // Invalid: empty string violates minLength(1)
    expect(() => decode({ _tag: 'string', string: '' })).toThrow()
    // Invalid: too long
    expect(() =>
      decode({ _tag: 'string', string: 'this is way too long' })
    ).toThrow()
  })

  test('non-overridden type uses default schema', () => {
    expect(() => decode({ _tag: 'boolean', boolean: true })).not.toThrow()
  })

  test('property: arbitrary respects override constraints', () => {
    const arb = Arbitrary.make(ChoiceWithOverride)
    fc.assert(
      fc.property(arb, (value) => {
        if (value._tag === 'string') {
          expect(value.string.length).toBeGreaterThanOrEqual(1)
          expect(value.string.length).toBeLessThanOrEqual(10)
        }
      })
    )
  })
})
