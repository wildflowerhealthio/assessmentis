import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { CodeableConcept } from './CodeableConcept'

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
