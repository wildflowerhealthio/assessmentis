import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { Composition } from './Composition'

const compositionArb = Arbitrary.make(Composition.Schema)

describe('Composition', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const encoded = Schema.encodeSync(Composition.Schema)(comp)
        const decoded = Schema.decodeSync(Composition.Schema)(encoded)
        expect(decoded).toEqual(comp)
      }),
      { numRuns: 10 }
    )
  })
})
