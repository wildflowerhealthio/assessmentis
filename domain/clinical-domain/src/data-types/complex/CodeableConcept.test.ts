import { expect, test, describe } from 'vitest'
import { CodeableConcept } from './CodeableConcept'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

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
