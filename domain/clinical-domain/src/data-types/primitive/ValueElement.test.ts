import { expect, test, describe } from 'vitest'
import { ValueElementFromFhirR4 } from './ValueElement'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const valueElementArb = Arbitrary.make(ValueElementFromFhirR4)

describe('ValueElement model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(valueElementArb, (valueElement) => {
        const encoded = Schema.encodeSync(ValueElementFromFhirR4)(valueElement)
        const decoded = Schema.decodeSync(ValueElementFromFhirR4)(encoded)
        expect(decoded).toEqual(valueElement)
      })
    )
  })
})
