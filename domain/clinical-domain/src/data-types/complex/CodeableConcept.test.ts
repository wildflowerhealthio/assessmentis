import { expect, test, describe } from 'vitest'
import { CodeableConceptFromFhirR4 } from './CodeableConcept'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const codeableConceptArb = Arbitrary.make(CodeableConceptFromFhirR4)

describe('CodeableConcept model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codeableConceptArb, (codeableConcept) => {
        const encoded = Schema.encodeSync(CodeableConceptFromFhirR4)(
          codeableConcept
        )
        const decoded = Schema.decodeSync(CodeableConceptFromFhirR4)(encoded)
        expect(decoded).toEqual(codeableConcept)
      })
    )
  })
})
