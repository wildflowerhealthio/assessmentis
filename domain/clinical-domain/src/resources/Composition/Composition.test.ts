import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import * as Composition from './Composition'

const compositionArb = Arbitrary.make(Composition.Composition)

describe('Composition', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const encoded = Schema.encodeSync(Composition.Composition)(comp)
        const decoded = Schema.decodeSync(Composition.Composition)(encoded)
        expect(decoded).toEqual(comp)
      }),
      { numRuns: 10 }
    )
  })
})
