import { expect, test, describe, expectTypeOf } from 'vitest'
import { ValueElement } from './ValueElement'
import type { ValueElementEncoded } from './ValueElement'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

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
