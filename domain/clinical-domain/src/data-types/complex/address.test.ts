import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Address } from './address'
import type { AddressEncoded } from './address'

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
        expect(decoded).toSchemaEqual(address)
      })
    )
  })
})
