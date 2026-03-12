import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import * as ContactPoint from './ContactPoint'

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
