import { expect, test, describe } from 'vitest'
import * as Practitioner from './Practitioner'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

const practitionerArb = Arbitrary.make(Practitioner.Practitioner)

describe('Practitioner model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(practitionerArb, (practitioner) => {
        const encoded = Schema.encodeSync(Practitioner.Practitioner)(
          practitioner
        )
        const decoded = Schema.decodeSync(Practitioner.Practitioner)(encoded)
        expect(decoded).toEqual(practitioner)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Practitioner must have resourceType
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing resourceType
          fc.record({
            name: fc.array(
              fc.record({
                given: fc.array(fc.string()),
                family: fc.string(),
              })
            ),
          }),
          // Wrong resourceType
          fc.record({
            resourceType: fc.constant('Patient' as const),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Practitioner.Practitioner)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
