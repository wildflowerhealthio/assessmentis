import { Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { FhirChoiceElementTransform } from './fhir-choice-element-transform'

// --- Fixtures ---

const valueTransform = FhirChoiceElementTransform('value', ['string', 'boolean', 'integer'])
const decodeSync = Schema.decodeSync(valueTransform)
const encodeSync = Schema.encodeSync(valueTransform)

/** Arbitrary flat FHIR-side value: exactly one of the choice keys or empty */
const flatFhirArb: fc.Arbitrary<Record<string, unknown>> = fc.oneof(
  fc.string().map((s) => ({ valueString: s })),
  fc.boolean().map((b) => ({ valueBoolean: b })),
  fc.integer().map((n) => ({ valueInteger: n })),
  fc.constant({})
)

/** Arbitrary domain-side tagged union or empty */
const taggedDomainArb: fc.Arbitrary<Record<string, unknown>> = fc.oneof(
  fc.string().map((s) => ({ value: { _tag: 'string', string: s } })),
  fc.boolean().map((b) => ({ value: { _tag: 'boolean', boolean: b } })),
  fc.integer().map((n) => ({ value: { _tag: 'integer', integer: n } })),
  fc.constant({})
)

// --- Tests ---

describe('FhirChoiceElementTransform', () => {
  describe('round-trip: decode ∘ encode = id', () => {
    test('every tagged domain value survives encode → decode', () => {
      fc.assert(
        fc.property(taggedDomainArb, (tagged) => {
          const flat = encodeSync(tagged as never)
          const roundTripped = decodeSync(flat as never)
          expect(roundTripped).toEqual(tagged)
        })
      )
    })

    test('every flat FHIR value survives decode → encode', () => {
      fc.assert(
        fc.property(flatFhirArb, (flat) => {
          const tagged = decodeSync(flat as never)
          const roundTripped = encodeSync(tagged as never)
          expect(roundTripped).toEqual(flat)
        })
      )
    })
  })

  describe('decode structure', () => {
    test('non-empty flat input decodes to { [prefix]: { _tag, [_tag]: value } }', () => {
      fc.assert(
        fc.property(flatFhirArb, (flat) => {
          const result = decodeSync(flat as never) as Record<string, unknown>
          if (Object.keys(flat).length === 0) {
            expect(result).toEqual({})
          } else {
            const choice = result.value as {
              _tag: string
              [k: string]: unknown
            }
            expect(choice._tag).toBeTypeOf('string')
            expect(choice[choice._tag]).toBeDefined()
          }
        })
      )
    })
  })

  describe('encode structure', () => {
    test('non-empty tagged input encodes to exactly one flat key', () => {
      fc.assert(
        fc.property(taggedDomainArb, (tagged) => {
          const result = encodeSync(tagged as never) as Record<string, unknown>
          const keys = Object.keys(result)
          if (Object.keys(tagged).length === 0) {
            expect(keys).toHaveLength(0)
          } else {
            expect(keys).toHaveLength(1)
            expect(keys[0]).toMatch(/^value[A-Z]/)
          }
        })
      )
    })
  })

  describe('prefix parameterisation', () => {
    const effectiveTransform = FhirChoiceElementTransform('effective', ['dateTime', 'string'])
    const decodeEffective = Schema.decodeSync(effectiveTransform)
    const encodeEffective = Schema.encodeSync(effectiveTransform)

    const effectiveFlatArb: fc.Arbitrary<Record<string, unknown>> = fc.oneof(
      fc.string().map((s) => ({ effectiveDateTime: s })),
      fc.string().map((s) => ({ effectiveString: s })),
      fc.constant({})
    )

    test('round-trips with a different prefix', () => {
      fc.assert(
        fc.property(effectiveFlatArb, (flat) => {
          const tagged = decodeEffective(flat as never)
          const roundTripped = encodeEffective(tagged as never)
          expect(roundTripped).toEqual(flat)
        })
      )
    })

    test('flat keys use the custom prefix', () => {
      fc.assert(
        fc.property(effectiveFlatArb, (flat) => {
          const tagged = decodeEffective(flat as never)
          const result = encodeEffective(tagged as never) as Record<string, unknown>
          for (const key of Object.keys(result)) {
            expect(key).toMatch(/^effective/)
          }
        })
      )
    })
  })
})
