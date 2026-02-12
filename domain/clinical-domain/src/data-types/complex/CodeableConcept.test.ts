import { expect, test, describe } from 'vitest'
import { CodeableConcept } from './CodeableConcept'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { CodeableConcept as FhirCodeableConcept } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _codeableConceptEncoded: DeepReadonly<FhirCodeableConcept> =
  CodeableConcept.Encoded

const codeableConceptArb = Arbitrary.make(CodeableConcept)

describe('CodeableConcept model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codeableConceptArb, (codeableConcept) => {
        const encoded = Schema.encodeSync(CodeableConcept)(codeableConcept)
        const decoded = Schema.decodeSync(CodeableConcept)(encoded)
        expect(decoded).toEqual(codeableConcept)
      })
    )
  })
})
