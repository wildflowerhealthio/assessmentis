import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Quantity } from './quantity'

const quantityArb = Arbitrary.make(Quantity)

describe('Quantity model', () => {
  test('Quantity.DomainType is "Quantity"', () => {
    expect(Quantity.DomainType).toBe('Quantity')
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(quantityArb, (quantity) => {
        const encoded = Schema.encodeSync(Quantity)(quantity)
        const decoded = Schema.decodeSync(Quantity)(encoded)
        expect(decoded).toSchemaEqual(quantity)
      })
    )
  })
})
