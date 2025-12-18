import { expect, test, describe } from 'vitest'
import { SimpleQuantity } from './SimpleQuantity'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Quantity as FhirQuantity } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _simpleQuantityEncoded: DeepReadonly<FhirQuantity> =
  SimpleQuantity.Encoded

describe('SimpleQuantity model', () => {
  test('property: encode-decode cycle preserves minimal SimpleQuantity', () => {
    // Property: Minimal valid SimpleQuantity should encode-decode correctly
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (value) => {
        const decode = Schema.decodeUnknownEither(SimpleQuantity)
        const encode = Schema.encodeUnknownEither(SimpleQuantity)

        const quantity = {
          value,
        }

        const decoded = decode(quantity)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right.value).toBe(value)
          }
        }
      })
    )
  })

  test('property: encode-decode cycle preserves full SimpleQuantity', () => {
    // Property: Full SimpleQuantity with all fields should encode-decode correctly
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.string(),
        fc.webUrl(),
        fc.string(),
        (value, unit, system, code) => {
          const decode = Schema.decodeUnknownEither(SimpleQuantity)
          const encode = Schema.encodeUnknownEither(SimpleQuantity)

          const quantity = {
            value,
            unit,
            system,
            code,
          }

          const decoded = decode(quantity)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.value).toBe(value)
              expect(encoded.right.unit).toBe(unit)
              expect(encoded.right.system).toBe(system)
              expect(encoded.right.code).toBe(code)
            }
          }
        }
      )
    )
  })

  test('property: empty SimpleQuantity encodes-decodes', () => {
    // Property: Empty SimpleQuantity (all optional fields) should be valid
    const decode = Schema.decodeUnknownEither(SimpleQuantity)
    const encode = Schema.encodeUnknownEither(SimpleQuantity)

    const quantity = {}

    const decoded = decode(quantity)
    expect(Either.isRight(decoded)).toBe(true)

    if (Either.isRight(decoded)) {
      const encoded = encode(decoded.right)
      expect(Either.isRight(encoded)).toBe(true)
    }
  })

  test('property: partial SimpleQuantity fields are preserved', () => {
    // Property: Partial quantities should preserve only provided fields
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ value: fc.double({ noNaN: true }) }),
          fc.record({ unit: fc.string() }),
          fc.record({ system: fc.webUrl() }),
          fc.record({ code: fc.string() }),
          fc.record({
            value: fc.double({ noNaN: true }),
            unit: fc.string(),
          })
        ),
        (partialQuantity) => {
          const decode = Schema.decodeUnknownEither(SimpleQuantity)
          const encode = Schema.encodeUnknownEither(SimpleQuantity)

          const decoded = decode(partialQuantity)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              // Verify that provided fields match
              if ('value' in partialQuantity) {
                expect(encoded.right.value).toBe(partialQuantity.value)
              }
              if ('unit' in partialQuantity) {
                expect(encoded.right.unit).toBe(partialQuantity.unit)
              }
              if ('system' in partialQuantity) {
                expect(encoded.right.system).toBe(partialQuantity.system)
              }
              if ('code' in partialQuantity) {
                expect(encoded.right.code).toBe(partialQuantity.code)
              }
            }
          }
        }
      )
    )
  })
})
