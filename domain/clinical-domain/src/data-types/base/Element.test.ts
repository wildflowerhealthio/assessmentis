import { expect, test, describe } from 'vitest'
import { Element } from './Element'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const TestElement = Element.Schema(Schema.String)

const elementArb = Arbitrary.make(TestElement)

describe('Element base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(elementArb, (element) => {
        const encoded = Schema.encodeSync(TestElement)(element)
        const decoded = Schema.decodeSync(TestElement)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
