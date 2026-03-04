import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { Quantity } from './Quantity'

const quantityArb = Arbitrary.make(Quantity)

describe('Quantity model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(Quantity)(quantity)
        const decoded = Schema.decodeSync(Quantity)(encoded)
        expect(decoded).toEqual(quantity)
      })
    )
  })
})
