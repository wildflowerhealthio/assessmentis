import { expect, test, describe } from 'vitest'
import { BackboneElement } from './BackboneElement'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const TestBackboneElement = BackboneElement.Schema(Schema.String)

const backboneElementArb = Arbitrary.make(TestBackboneElement)

describe('BackboneElement base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(backboneElementArb, (element) => {
        const encoded = Schema.encodeSync(TestBackboneElement)(element)
        const decoded = Schema.decodeSync(TestBackboneElement)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
