import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import {
  Identifier,
  Reference,
  type IdentifierEncoded,
  type ReferenceEncoded,
} from './IdentifierAndReference'

const referenceArb = Arbitrary.make(Reference)

describe('Reference model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof Reference.Encoded>().toExtend<ReferenceEncoded>()
  })
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(Reference)(reference)
        const decoded = Schema.decodeSync(Reference)(encoded)
        expect(decoded).toEqual(reference)
      })
    )
  })
})

const identifierArb = Arbitrary.make(Identifier)

describe('Identifier model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof Identifier.Encoded>().toExtend<IdentifierEncoded>()
  })
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(identifierArb, (identifier) => {
        const encoded = Schema.encodeSync(Identifier)(identifier)
        const decoded = Schema.decodeSync(Identifier)(encoded)
        expect(decoded).toEqual(identifier)
      })
    )
  })
})
