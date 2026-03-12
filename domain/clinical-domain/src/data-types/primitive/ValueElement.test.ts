import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { ValueElement, type ValueElementEncoded } from './ValueElement'

const valueElementArb = Arbitrary.make(ValueElement)

describe('ValueElement model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof ValueElement.Encoded>().toExtend<ValueElementEncoded>()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(valueElementArb, (valueElement) => {
        const encoded = Schema.encodeSync(ValueElement)(valueElement)
        const decoded = Schema.decodeSync(ValueElement)(encoded)
        expect(decoded).toEqual(valueElement)
      })
    )
  })
})
