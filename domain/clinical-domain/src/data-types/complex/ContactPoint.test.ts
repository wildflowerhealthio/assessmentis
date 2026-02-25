import { expect, test, describe } from 'vitest'
import * as ContactPoint from './ContactPoint'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const contactPointArb = Arbitrary.make(ContactPoint.ContactPoint)

describe('ContactPoint model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(contactPointArb, (contactPoint) => {
        const encoded = Schema.encodeSync(ContactPoint.ContactPoint)(
          contactPoint
        )
        const decoded = Schema.decodeSync(ContactPoint.ContactPoint)(encoded)
        expect(decoded).toEqual(contactPoint)
      })
    )
  })
})
