import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { CodeableConcept } from './codeable-concept'

const codeableConceptArb = Arbitrary.make(CodeableConcept)

describe('CodeableConcept model', () => {
  test('CodeableConcept.DomainType is "CodeableConcept"', () => {
    expect(CodeableConcept.DomainType).toBe('CodeableConcept')
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codeableConceptArb, (codeableConcept) => {
        const encoded = Schema.encodeSync(CodeableConcept)(codeableConcept)
        const decoded = Schema.decodeSync(CodeableConcept)(encoded)
        expect(decoded).toSchemaEqual(codeableConcept)
      })
    )
  })
})
