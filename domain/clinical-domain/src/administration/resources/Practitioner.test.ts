import { expect, test, describe } from 'vitest'
import { PractitionerFromFhirR4 } from './Practitioner'
import type { DeepReadonly } from '@assessmentis/util'
import type { Practitioner as FhirPractitioner } from 'fhir/r4'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _practitionerEncoded: DeepReadonly<FhirPractitioner> =
  PractitionerFromFhirR4.Encoded

const practitionerArb = Arbitrary.make(PractitionerFromFhirR4)

describe('Practitioner model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(practitionerArb, (practitioner) => {
        const encoded = Schema.encodeSync(PractitionerFromFhirR4)(practitioner)
        const decoded = Schema.decodeSync(PractitionerFromFhirR4)(encoded)
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
          const decode = Schema.decodeUnknownEither(PractitionerFromFhirR4)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
