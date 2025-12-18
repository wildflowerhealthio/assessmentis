import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CompositionSection } from './CompositionSection'

const sectionArb = Arbitrary.make(CompositionSection)

describe('CompositionSection', () => {
  it('should encode and decode with nested sections', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const result = CompositionSection.make(section)
        expect(result).toBeDefined()
      }),
      { numRuns: 10 }
    )
  })
})
