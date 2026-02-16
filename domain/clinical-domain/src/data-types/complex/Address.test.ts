import { expect, test, describe } from 'vitest'
import { AddressFromFhirR4 } from './Address'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const addressArb = Arbitrary.make(AddressFromFhirR4)

describe('Address model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(addressArb, (address) => {
        const encoded = Schema.encodeSync(AddressFromFhirR4)(address)
        const decoded = Schema.decodeSync(AddressFromFhirR4)(encoded)
        expect(decoded).toEqual(address)
      })
    )
  })
})
