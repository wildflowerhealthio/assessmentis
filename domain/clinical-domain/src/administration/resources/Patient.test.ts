import { expect, test, describe } from 'vitest'
import { PatientFromFhirR4 } from './Patient'
import type { DeepReadonly } from '@assessmentis/util'
import type { Patient as FhirPatient } from 'fhir/r4'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _patientEncoded: DeepReadonly<FhirPatient> = PatientFromFhirR4.Encoded

const patientArb = Arbitrary.make(PatientFromFhirR4)

describe('Patient model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(patientArb, (patient) => {
        const encoded = Schema.encodeSync(PatientFromFhirR4)(patient)
        const decoded = Schema.decodeSync(PatientFromFhirR4)(encoded)
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
          const decode = Schema.decodeUnknownEither(PatientFromFhirR4)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
