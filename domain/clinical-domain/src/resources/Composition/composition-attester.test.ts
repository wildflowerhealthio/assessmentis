import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { CompositionAttester } from './composition-attester'

const attesterArb = Arbitrary.make(CompositionAttester)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const encoded = Schema.encodeSync(CompositionAttester)(attester)
        const decoded = Schema.decodeSync(CompositionAttester)(encoded)
        expect(decoded).toSchemaEqual(attester)
      }),
      { numRuns: 10 }
    )
  })
})
