import { expect, test, describe } from 'vitest'
import { Patient } from './Patient'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

const patientArb = Arbitrary.make(Patient.Schema)

describe('Patient model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(patientArb, (patient) => {
        const encoded = Schema.encodeSync(Patient.Schema)(patient)
        const decoded = Schema.decodeSync(Patient.Schema)(encoded)
        expect(decoded).toEqual(patient)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Patient must have resourceType
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
            resourceType: fc.constant('Practitioner' as const),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Patient.Schema)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
