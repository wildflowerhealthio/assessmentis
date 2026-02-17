import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CompositionAttester } from './CompositionAttester'

const attesterArb = Arbitrary.make(CompositionAttester.Schema)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const encoded = Schema.encodeSync(CompositionAttester.Schema)(
          attester
        )
        const decoded = Schema.decodeSync(CompositionAttester.Schema)(
          encoded
        )
        expect(decoded).toEqual(attester)
      }),
      { numRuns: 10 }
    )
  })
})
