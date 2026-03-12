import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import * as Range from './Range'

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
