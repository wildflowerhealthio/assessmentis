import { expect, test, describe } from 'vitest'
import { Range } from './Range'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Range as FhirRange } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _rangeEncoded: DeepReadonly<FhirRange> = Range.Encoded

describe('Range model', () => {
  const simpleQuantityArb = fc.record({
    value: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
    unit: fc.option(fc.string(), { nil: undefined }),
    system: fc.option(fc.webUrl(), { nil: undefined }),
    code: fc.option(fc.string(), { nil: undefined }),
  })

  test('property: encode-decode cycle preserves minimal Range', () => {
    // Property: Minimal valid Range should encode-decode correctly
    fc.assert(
      fc.property(fc.double({ noNaN: true }), (lowValue) => {
        const decode = Schema.decodeUnknownEither(Range)
        const encode = Schema.encodeUnknownEither(Range)

        const range = {
          low: { value: lowValue },
        }

        const decoded = decode(range)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right.low?.value).toBe(lowValue)
          }
        }
      })
    )
  })

  test('property: encode-decode cycle preserves full Range', () => {
    // Property: Full Range with low and high should encode-decode correctly
    fc.assert(
      fc.property(simpleQuantityArb, simpleQuantityArb, (low, high) => {
        const decode = Schema.decodeUnknownEither(Range)
        const encode = Schema.encodeUnknownEither(Range)

        const range = {
          low,
          high,
        }

        const decoded = decode(range)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right.low?.value).toBe(low.value)
            expect(encoded.right.low?.unit).toBe(low.unit)
            expect(encoded.right.high?.value).toBe(high.value)
            expect(encoded.right.high?.unit).toBe(high.unit)
          }
        }
      })
    )
  })

  test('property: empty Range encodes-decodes', () => {
    // Property: Empty Range (all optional fields) should be valid
    const decode = Schema.decodeUnknownEither(Range)
    const encode = Schema.encodeUnknownEither(Range)

    const range = {}

    const decoded = decode(range)
    expect(Either.isRight(decoded)).toBe(true)

    if (Either.isRight(decoded)) {
      const encoded = encode(decoded.right)
      expect(Either.isRight(encoded)).toBe(true)
    }
  })

  test('property: Range with only low is valid', () => {
    // Property: Range with only low boundary should be valid
    fc.assert(
      fc.property(simpleQuantityArb, (low) => {
        const decode = Schema.decodeUnknownEither(Range)
        const encode = Schema.encodeUnknownEither(Range)

        const range = { low }

        const decoded = decode(range)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right.low?.value).toBe(low.value)
            expect(encoded.right.high).toBeUndefined()
          }
        }
      })
    )
  })

  test('property: Range with only high is valid', () => {
    // Property: Range with only high boundary should be valid
    fc.assert(
      fc.property(simpleQuantityArb, (high) => {
        const decode = Schema.decodeUnknownEither(Range)
        const encode = Schema.encodeUnknownEither(Range)

        const range = { high }

        const decoded = decode(range)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right.high?.value).toBe(high.value)
            expect(encoded.right.low).toBeUndefined()
          }
        }
      })
    )
  })

  test('property: Range preserves quantity units', () => {
    // Property: Units in low and high quantities should be preserved
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        fc.string(),
        fc.webUrl(),
        fc.string(),
        (lowValue, highValue, unit, system, code) => {
          const decode = Schema.decodeUnknownEither(Range)
          const encode = Schema.encodeUnknownEither(Range)

          const range = {
            low: { value: lowValue, unit, system, code },
            high: { value: highValue, unit, system, code },
          }

          const decoded = decode(range)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.low?.value).toBe(lowValue)
              expect(encoded.right.low?.unit).toBe(unit)
              expect(encoded.right.low?.system).toBe(system)
              expect(encoded.right.low?.code).toBe(code)
              expect(encoded.right.high?.value).toBe(highValue)
              expect(encoded.right.high?.unit).toBe(unit)
              expect(encoded.right.high?.system).toBe(system)
              expect(encoded.right.high?.code).toBe(code)
            }
          }
        }
      )
    )
  })
})
