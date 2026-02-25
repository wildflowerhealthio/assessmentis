import { expect, test, describe } from 'vitest'
import * as Quantity from './Quantity'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const quantityArb = Arbitrary.make(Quantity.Quantity)

describe('Quantity model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(Quantity.Quantity)(quantity)
        const decoded = Schema.decodeSync(Quantity.Quantity)(encoded)
        expect(decoded).toEqual(quantity)
      })
    )
  })
})
