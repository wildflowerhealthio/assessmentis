import { expect, test, describe } from 'vitest'
import { Address } from './Address'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const addressArb = Arbitrary.make(Address.Schema)

describe('Address model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(addressArb, (address) => {
        const encoded = Schema.encodeSync(Address.Schema)(address)
        const decoded = Schema.decodeSync(Address.Schema)(encoded)
        expect(decoded).toEqual(address)
      })
    )
  })
})
