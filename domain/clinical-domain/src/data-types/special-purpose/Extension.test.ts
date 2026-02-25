import { expect, test, describe } from 'vitest'
import { Schema } from 'effect'
import { capitalize } from 'effect/String'
import * as fc from 'fast-check'
import { Extension, type ExtensionEncoded } from './Extension'
import { AllDatatypeKeys } from '../Datatype'

const decode = Schema.decodeSync(Extension)

// Expected value[x] option keys — derived from the same source as the
// production code so the test stays in sync with AllDatatypeKeys.
const expectedOptionKeys = [...AllDatatypeKeys].map(
  (k) => `value${capitalize(k)}`
)

// Map of value[x] key → a sample value that satisfies the field's schema.
// Typed primitives need their specific type; Schema.Unknown keys accept anything.
const sampleValueForKey = (key: string): unknown => {
  switch (key) {
    case 'valueBoolean':
      return true
    case 'valueDecimal':
    case 'valueInteger':
      return 42
    case 'valueDate':
      return '2024-01-01'
    case 'valueDateTime':
      return '2024-01-01T00:00:00Z'
    default:
      return 'sentinel'
  }
}

// Arbitrary: a single random option key
const optionKeyArb = fc.constantFrom(...expectedOptionKeys)

// Arbitrary: exactly two distinct option keys
const twoOptionKeysArb = fc
  .subarray(expectedOptionKeys, { minLength: 2, maxLength: 2 })
  .filter((arr) => arr.length === 2)

describe('Extension', () => {
  test('Element mixin: Key static equals "Extension"', () => {
    expect(Extension.Key).toBe('Extension')
  })

  test('DatatypeChoice mixin: allOptionKeys matches all value-prefixed datatype keys', () => {
    expect(new Set(Extension.allOptionKeys())).toEqual(
      new Set(expectedOptionKeys)
    )
  })

  test('property: minimal decode defaults domainType, extension, and all value[x] to absent', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (url) => {
        const ext = decode({ definitionUrl: url })
        expect(ext.domainType).toBe('Extension')
        expect(ext.extension).toEqual([])
        expect(ext.definitionUrl).toBe(url)
      })
    )
  })

  test('property: isNonePresent is true when no value[x] key is set', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (url) => {
        const ext = decode({ definitionUrl: url }) as Extension
        expect(ext.isNonePresent()).toBe(true)
      })
    )
  })

  test('property: setting exactly one value[x] key makes isExactlyOnePresent true', () => {
    fc.assert(
      fc.property(optionKeyArb, (key) => {
        const ext = decode({
          definitionUrl: 'http://test',
          [key]: sampleValueForKey(key),
        }) as Extension
        expect(ext.isExactlyOnePresent()).toBe(true)
        expect(ext.isNonePresent()).toBe(false)
      })
    )
  })

  test('property: setting two value[x] keys → isExactlyOnePresent false, isNonePresent false', () => {
    fc.assert(
      fc.property(twoOptionKeysArb, ([keyA, keyB]) => {
        const ext = decode({
          definitionUrl: 'http://test',
          [keyA]: sampleValueForKey(keyA),
          [keyB]: sampleValueForKey(keyB),
        }) as Extension
        expect(ext.isExactlyOnePresent()).toBe(false)
        expect(ext.isNonePresent()).toBe(false)
      })
    )
  })

  test('self-recursive: decodes nested extensions preserving value[x]', () => {
    const ext = decode({
      definitionUrl: 'http://outer',
      valueString: 'outer-value',
      extension: [
        {
          definitionUrl: 'http://inner',
          valueInteger: 42,
        },
      ],
    })
    expect(ext.extension).toHaveLength(1)
    expect(ext.extension[0].definitionUrl).toBe('http://inner')
    // Child is also an Extension with mixin methods
    const child = ext.extension[0] as Extension
    expect(child.isExactlyOnePresent()).toBe(true)
  })
})
