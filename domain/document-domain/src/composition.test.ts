import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { DeepReadonly } from '@assessmentis/util'
import { Composition, Section, CompositionAttester } from './composition'
import {
  Composition as FhirComposition,
  CompositionAttester as FhirCompositionAttester,
} from 'fhir/r4'

// Compile-time check that our Encoded schemas are compatible with FHIR R4 types
const _compositionAttesterEncoded: DeepReadonly<FhirCompositionAttester> =
  CompositionAttester.Encoded
const _compositionEncoded: DeepReadonly<FhirComposition> = Composition.Encoded

// Use Arbitrary.make to generate values from schemas
const compositionArb = Arbitrary.make(Composition)
const sectionArb = Arbitrary.make(Section)

describe('Composition property-based tests', () => {
  it('should create valid Compositions with schema-generated values', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const result = Composition.make(comp)
        expect(result.resourceType).toBe('Composition')
        expect(result.status).toBeDefined()
        expect(result.type).toBeDefined()
        expect(result.subject).toBeDefined()
        expect(result.date).toBeDefined()
        expect(result.author).toBeDefined()
        expect(result.title).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should support all status values', () => {
    const statusArb = fc.constantFrom(
      'preliminary' as const,
      'final' as const,
      'amended' as const,
      'entered-in-error' as const
    )

    fc.assert(
      fc.property(compositionArb, statusArb, (comp, status) => {
        const composition = { ...comp, status }
        const result = Composition.make(composition)
        expect(result.status).toBe(status)
      })
    )
  })

  it('should handle sections with nested structures', () => {
    fc.assert(
      fc.property(
        compositionArb,
        fc.array(sectionArb, { minLength: 1, maxLength: 3 }),
        (comp, sections) => {
          const composition = { ...comp, section: sections }
          const result = Composition.make(composition)
          expect(result.section).toHaveLength(sections.length)
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('Section property-based tests', () => {
  it('should create valid Sections with schema-generated values', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const result = Section.make(section)
        expect(result).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should support all mode values when specified', () => {
    const modeArb = fc.constantFrom(
      'working' as const,
      'snapshot' as const,
      'changes' as const
    )

    fc.assert(
      fc.property(modeArb, (mode) => {
        const section = Section.make({ mode })
        expect(section.mode).toBe(mode)
      })
    )
  })

  it('should handle deeply nested sections', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const result = Section.make(section)

        // Verify structure is preserved
        const checkNesting = (s: typeof Section.Type) => {
          if (s.section) {
            expect(Array.isArray(s.section)).toBe(true)
            s.section.forEach(checkNesting)
          }
        }

        checkNesting(result)
      }),
      { numRuns: 50 }
    )
  })
})

describe('FHIR R4 compatibility', () => {
  it('should validate that Composition schema matches FHIR R4 structure', () => {
    // This test validates at compile-time and runtime that our Composition.Encoded type
    // is structurally compatible with FHIR R4 Composition requirements
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const result = Composition.make(comp)

        // Verify all required FHIR R4 Composition fields are present
        expect(result.resourceType).toBe('Composition')
        expect(result.status).toBeDefined()
        expect(result.type).toBeDefined()
        expect(result.subject).toBeDefined()
        expect(result.date).toBeDefined()
        expect(result.author).toBeDefined()
        expect(result.title).toBeDefined()

        // Verify status is one of the allowed FHIR R4 values
        expect([
          'preliminary',
          'final',
          'amended',
          'entered-in-error',
        ]).toContain(result.status)
      }),
      { numRuns: 50 }
    )
  })
})
