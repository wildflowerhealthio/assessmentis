import { expect, test, describe } from 'vitest'
import { QuantityFromFhirR4 } from './Quantity'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const quantityArb = Arbitrary.make(QuantityFromFhirR4)

describe('Quantity model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(QuantityFromFhirR4)(quantity)
        const decoded = Schema.decodeSync(QuantityFromFhirR4)(encoded)
        expect(decoded).toEqual(quantity)
      })
    )
  })
})
