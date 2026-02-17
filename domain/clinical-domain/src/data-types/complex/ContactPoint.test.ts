import { expect, test, describe } from 'vitest'
import { ContactPoint } from './ContactPoint'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const contactPointArb = Arbitrary.make(ContactPoint.Schema)

describe('ContactPoint model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(contactPointArb, (contactPoint) => {
        const encoded = Schema.encodeSync(ContactPoint.Schema)(contactPoint)
        const decoded = Schema.decodeSync(ContactPoint.Schema)(encoded)
        expect(decoded).toEqual(contactPoint)
      })
    )
  })
})
