import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CompositionAttesterSchema } from './CompositionAttester'

const attesterArb = Arbitrary.make(CompositionAttesterSchema)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const encoded = Schema.encodeSync(CompositionAttesterSchema)(attester)
        const decoded = Schema.decodeSync(CompositionAttesterSchema)(encoded)
        expect(decoded).toEqual(attester)
      }),
      { numRuns: 10 }
    )
  })
})
