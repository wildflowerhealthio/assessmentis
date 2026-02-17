import { expect, test, describe } from 'vitest'
import { Identifier, Reference } from './IdentifierAndReference'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const referenceArb = Arbitrary.make(Reference.Schema)

describe('Reference model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(Reference.Schema)(reference)
        const decoded = Schema.decodeSync(Reference.Schema)(encoded)
        expect(decoded).toEqual(reference)
      })
    )
  })
})

const identifierArb = Arbitrary.make(Identifier.Schema)

describe('Identifier model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(identifierArb, (identifier) => {
        const encoded = Schema.encodeSync(Identifier.Schema)(identifier)
        const decoded = Schema.decodeSync(Identifier.Schema)(encoded)
        expect(decoded).toEqual(identifier)
      })
    )
  })
})
