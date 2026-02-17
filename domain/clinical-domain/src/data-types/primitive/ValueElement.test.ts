import { expect, test, describe } from 'vitest'
import { ValueElement } from './ValueElement'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const valueElementArb = Arbitrary.make(ValueElement.Schema)

describe('ValueElement model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(valueElementArb, (valueElement) => {
        const encoded = Schema.encodeSync(ValueElement.Schema)(valueElement)
        const decoded = Schema.decodeSync(ValueElement.Schema)(encoded)
        expect(decoded).toEqual(valueElement)
      })
    )
  })
})
