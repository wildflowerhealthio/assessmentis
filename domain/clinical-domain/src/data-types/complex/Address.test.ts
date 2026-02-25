import { expect, test, describe, expectTypeOf } from 'vitest'
import { Address } from './Address'
import type { AddressEncoded } from './Address'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

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
