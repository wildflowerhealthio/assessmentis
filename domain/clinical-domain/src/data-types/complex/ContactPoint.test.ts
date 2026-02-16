import { expect, test, describe } from 'vitest'
import { ContactPointFromFhirR4 } from './ContactPoint'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const contactPointArb = Arbitrary.make(ContactPointFromFhirR4)

describe('ContactPoint model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(contactPointArb, (contactPoint) => {
        const encoded = Schema.encodeSync(ContactPointFromFhirR4)(contactPoint)
        const decoded = Schema.decodeSync(ContactPointFromFhirR4)(encoded)
        expect(decoded).toEqual(contactPoint)
      })
    )
  })
})
