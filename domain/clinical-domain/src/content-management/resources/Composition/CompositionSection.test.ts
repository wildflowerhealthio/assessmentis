import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CompositionSection } from './CompositionSection'

const sectionArb = Arbitrary.make(CompositionSection.Schema)

describe('CompositionSection', () => {
  it('should encode and decode with nested sections', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const encoded = Schema.encodeSync(CompositionSection.Schema)(section)
        const decoded = Schema.decodeSync(CompositionSection.Schema)(encoded)
        expect(decoded).toEqual(section)
      }),
      { numRuns: 10 }
    )
  })
})
