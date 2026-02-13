import { expect, test, describe } from 'vitest'
import { SimpleQuantity } from './SimpleQuantity'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Quantity as FhirQuantity } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _simpleQuantityEncoded: DeepReadonly<FhirQuantity> =
  SimpleQuantity.Encoded

const quantityArb = Arbitrary.make(SimpleQuantity)

describe('SimpleQuantity model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(SimpleQuantity)(quantity)
        const decoded = Schema.decodeSync(SimpleQuantity)(encoded)
        expect(decoded).toEqual(quantity)
      })
    )
  })
})
