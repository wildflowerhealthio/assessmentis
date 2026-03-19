import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { CompositionSection } from './composition-section'

const sectionArb = Arbitrary.make(CompositionSection)

describe('CompositionSection', () => {
  it('should encode and decode with nested sections', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const encoded = Schema.encodeSync(CompositionSection)(section)
        const decoded = Schema.decodeSync(CompositionSection)(encoded)
        expect(decoded).toSchemaEqual(section)
      }),
      { numRuns: 10 }
    )
  })
})
