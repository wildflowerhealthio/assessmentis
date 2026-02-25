import { expect, test, describe } from 'vitest'
import * as Range from './Range'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const rangeArb = Arbitrary.make(Range.Range)

describe('Range model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(rangeArb, (range) => {
        const encoded = Schema.encodeSync(Range.Range)(range)
        const decoded = Schema.decodeSync(Range.Range)(encoded)
        expect(decoded).toEqual(range)
      })
    )
  })
})
