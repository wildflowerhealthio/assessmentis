import { expect, test, describe } from 'vitest'
import { Range } from './Range'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const rangeArb = Arbitrary.make(Range.Schema)

describe('Range model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(rangeArb, (range) => {
        const encoded = Schema.encodeSync(Range.Schema)(range)
        const decoded = Schema.decodeSync(Range.Schema)(encoded)
        expect(decoded).toEqual(range)
      })
    )
  })
})
