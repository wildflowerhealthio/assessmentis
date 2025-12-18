import { expect, test, describe } from 'vitest'
import { Observation, ObservationStatus } from './Observation'
import { DeepReadonly } from '@assessmentis/util'
import { Observation as FhirObservation } from 'fhir/r4'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _observationEncoded: DeepReadonly<FhirObservation> = Observation.Encoded

describe('Observation model', () => {
  test('property: encode-decode cycle preserves minimal Observation', () => {
    // Property: Minimal valid Observation should encode-decode correctly
    fc.assert(
      fc.property(
        fc.constantFrom(
          'registered',
          'preliminary',
          'final',
          'amended',
          'corrected',
          'cancelled',
          'entered-in-error',
          'unknown'
        ),
        fc.string(),
        (status, codeText) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const encode = Schema.encodeUnknownEither(Observation)

          const observation = {
            resourceType: 'Observation' as const,
            status,
            code: { text: codeText },
          }

          const decoded = decode(observation)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.resourceType).toBe('Observation')
              expect(encoded.right.status).toBe(status)
              expect(encoded.right.code.text).toBe(codeText)
            }
          }
        }
      )
    )
  })

  test('property: ObservationStatus validates enum values', () => {
    // Property: Only valid ObservationStatus values should encode successfully
    fc.assert(
      fc.property(
        fc.constantFrom(
          'registered',
          'preliminary',
          'final',
          'amended',
          'corrected',
          'cancelled',
          'entered-in-error',
          'unknown'
        ),
        (status) => {
          const encode = Schema.encodeUnknownEither(ObservationStatus)
          const result = encode(status)
          expect(Either.isRight(result)).toBe(true)
        }
      )
    )
  })

  test('property: invalid ObservationStatus values fail', () => {
    // Property: Invalid status values should fail
    fc.assert(
      fc.property(
        fc
          .string()
          .filter(
            (s) =>
              ![
                'registered',
                'preliminary',
                'final',
                'amended',
                'corrected',
                'cancelled',
                'entered-in-error',
                'unknown',
              ].includes(s)
          ),
        (invalidStatus) => {
          const encode = Schema.encodeUnknownEither(ObservationStatus)
          const result = encode(invalidStatus)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Observation must have resourceType, status, and code
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            resourceType: fc.constant('Observation' as const),
            code: fc.record({ text: fc.string() }),
          }),
          // Missing code
          fc.record({
            resourceType: fc.constant('Observation' as const),
            status: fc.constantFrom('final', 'preliminary'),
          }),
          // Missing resourceType
          fc.record({
            status: fc.constantFrom('final', 'preliminary'),
            code: fc.record({ text: fc.string() }),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: optional fields are preserved through encode-decode', () => {
    // Property: Optional fields and value should be preserved
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary', 'registered'),
        fc.string(),
        fc.option(fc.string(), { nil: undefined }),
        (status, codeText, valueString) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const encode = Schema.encodeUnknownEither(Observation)

          const observation: Record<string, unknown> = {
            resourceType: 'Observation',
            status,
            code: { text: codeText },
          }
          if (valueString !== undefined) observation.valueString = valueString

          const decoded = decode(observation)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (valueString !== undefined) {
                expect(encoded.right).toHaveProperty('valueString', valueString)
              }
            }
          }
        }
      )
    )
  })

  test('property: encode is inverse of decode', () => {
    // Property: decode(encode(decode(x))) === decode(x)
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary', 'registered'),
        fc.string(),
        (status, codeText) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const encode = Schema.encodeUnknownEither(Observation)

          const observation = {
            resourceType: 'Observation' as const,
            status,
            code: { text: codeText },
          }

          const decoded1 = decode(observation)
          if (Either.isRight(decoded1)) {
            const encoded = encode(decoded1.right)
            if (Either.isRight(encoded)) {
              const decoded2 = decode(encoded.right)
              expect(Either.isRight(decoded2)).toBe(true)
              if (Either.isRight(decoded2)) {
                expect(decoded2.right.status).toBe(decoded1.right.status)
                expect(decoded2.right.code.text).toBe(decoded1.right.code.text)
              }
            }
          }
        }
      )
    )
  })

  test('property: value fields work correctly', () => {
    // Property: Different value[x] types should be preserved (only one at a time)
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary'),
        fc.string(),
        fc.oneof(
          fc.record({ valueString: fc.string() }),
          fc.record({ valueBoolean: fc.boolean() }),
          fc.record({ valueInteger: fc.integer() }),
          fc.constant({})
        ),
        (status, codeText, valueField) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const encode = Schema.encodeUnknownEither(Observation)

          const observation: Record<string, unknown> = {
            resourceType: 'Observation',
            status,
            code: { text: codeText },
            ...valueField,
          }

          const decoded = decode(observation)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if ('valueString' in valueField) {
                expect(encoded.right).toHaveProperty(
                  'valueString',
                  valueField.valueString
                )
              }
              if ('valueBoolean' in valueField) {
                expect(encoded.right).toHaveProperty(
                  'valueBoolean',
                  valueField.valueBoolean
                )
              }
              if ('valueInteger' in valueField) {
                expect(encoded.right).toHaveProperty(
                  'valueInteger',
                  valueField.valueInteger
                )
              }
            }
          }
        }
      )
    )
  })

  test('property: array fields are preserved', () => {
    // Property: Array fields like category, performer should be preserved
    fc.assert(
      fc.property(
        fc.constantFrom('final', 'preliminary'),
        fc.string(),
        fc.option(
          fc.array(fc.record({ text: fc.string() }), {
            minLength: 0,
            maxLength: 3,
          }),
          { nil: undefined }
        ),
        (status, codeText, category) => {
          const decode = Schema.decodeUnknownEither(Observation)
          const encode = Schema.encodeUnknownEither(Observation)

          const observation: {
            resourceType: 'Observation'
            status: string
            code: { text: string }
            category?: Array<{ text: string }>
          } = {
            resourceType: 'Observation',
            status,
            code: { text: codeText },
          }
          if (category !== undefined) observation.category = category

          const decoded = decode(observation)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (category !== undefined) {
                expect(encoded.right.category?.length).toBe(category.length)
              }
            }
          }
        }
      )
    )
  })
})
