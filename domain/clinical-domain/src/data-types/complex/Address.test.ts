import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { Address } from './Address'
import type { AddressEncoded } from './Address'

const addressArb = Arbitrary.make(Address)

describe('Address model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof Address.Encoded>().toExtend<AddressEncoded>()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(addressArb, (address) => {
        const encoded = Schema.encodeSync(Address)(address)
        const decoded = Schema.decodeSync(Address)(encoded)
        expect(decoded).toEqual(address)
      })
    )
  })
})
