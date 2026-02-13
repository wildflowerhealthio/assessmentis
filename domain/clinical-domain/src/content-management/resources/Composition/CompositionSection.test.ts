import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CompositionSectionFromFhirR4 } from './CompositionSection'

const sectionArb = Arbitrary.make(CompositionSectionFromFhirR4)

describe('CompositionSection', () => {
  it('should encode and decode with nested sections', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const encoded = Schema.encodeSync(CompositionSectionFromFhirR4)(section)
        const decoded = Schema.decodeSync(CompositionSectionFromFhirR4)(encoded)
        expect(decoded).toEqual(section)
      }),
      { numRuns: 10 }
    )
  })
})
