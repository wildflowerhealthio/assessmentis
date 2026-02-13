import { expect, test, describe } from 'vitest'
import { ObservationFromFhirR4 } from './Observation'
import type { DeepReadonly } from '@assessmentis/util'
import type { Observation as FhirObservation } from 'fhir/r4'
import { Schema, Arbitrary, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _observationEncoded: DeepReadonly<FhirObservation> =
  ObservationFromFhirR4.Encoded

const observationArb = Arbitrary.make(ObservationFromFhirR4)

describe('Observation model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(observationArb, (obs) => {
        const encoded = Schema.encodeSync(ObservationFromFhirR4)(obs)
        const decoded = Schema.decodeSync(ObservationFromFhirR4)(encoded)
        expect(decoded).toEqual(obs)
      })
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
          const decode = Schema.decodeUnknownEither(ObservationFromFhirR4)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
