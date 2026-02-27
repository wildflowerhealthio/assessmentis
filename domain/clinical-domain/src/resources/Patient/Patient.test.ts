import { expect, test, describe } from 'vitest'
import * as Patient from './Patient'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

const patientArb = Arbitrary.make(Patient.Patient)

describe('Patient model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(patientArb, (patient) => {
        const encoded = Schema.encodeSync(Patient.Patient)(patient)
        const decoded = Schema.decodeSync(Patient.Patient)(encoded)
        expect(decoded).toEqual(patient)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Patient must have correct domainType or none
    fc.assert(
      fc.property(
        fc.oneof(
          // Wrong domainType
          fc.record({
            domainType: fc.constant('Practitioner' as const),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Patient.Patient)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
