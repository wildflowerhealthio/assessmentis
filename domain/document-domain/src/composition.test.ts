import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { Code } from '@assessmentis/clinical-domain'
import { Composition, Section, CompositionId } from './composition'

// Type compatibility check with FHIR R4
// Note: @types/fhir is currently FHIR 3.0, but our schema is based on FHIR R4 spec
// This ensures our Composition.Encoded type is structurally compatible with FHIR Composition
type FhirCompositionCompatibility = {
  resourceType: 'Composition'
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  type: unknown
  subject: unknown
  date: string
  author: readonly unknown[]
  title: string
}

// Compile-time check that our Composition.Encoded is compatible with FHIR
const _compositionIsFhirCompatible: FhirCompositionCompatibility =
  {} as typeof Composition.Encoded

// Arbitraries for property-based testing
const compositionStatusArb = fc.constantFrom(
  'preliminary' as const,
  'final' as const,
  'amended' as const,
  'entered-in-error' as const
)

const sectionModeArb = fc.constantFrom(
  'working' as const,
  'snapshot' as const,
  'changes' as const
)

const codeableConceptArb = fc.record({
  coding: fc.array(
    fc.record({
      system: fc.constant('http://loinc.org'),
      code: fc.string({ minLength: 3, maxLength: 20 }).map((s) => Code.make(s)),
      display: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
        nil: undefined,
      }),
    }),
    { minLength: 1, maxLength: 3 }
  ),
  text: fc.option(fc.string(), { nil: undefined }),
})

const referenceArb = fc.record({
  reference: fc.string({ minLength: 5, maxLength: 50 }),
  display: fc.option(fc.string(), { nil: undefined }),
})

const narrativeArb = fc.record({
  status: fc.constantFrom('generated', 'extensions', 'additional', 'empty'),
  div: fc.string({ minLength: 10, maxLength: 100 }),
})

const sectionArb: fc.Arbitrary<typeof Section.Type> = fc.letrec((tie) => ({
  section: fc.record({
    title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: undefined,
    }),
    code: fc.option(codeableConceptArb, { nil: undefined }),
    text: fc.option(narrativeArb, { nil: undefined }),
    mode: fc.option(sectionModeArb, { nil: undefined }),
    entry: fc.option(fc.array(referenceArb, { maxLength: 5 }), {
      nil: undefined,
    }),
    section: fc.option(
      fc.array(tie('section') as fc.Arbitrary<typeof Section.Type>, {
        maxLength: 2,
      }),
      { nil: undefined }
    ),
  }),
})).section as fc.Arbitrary<typeof Section.Type>

const minimalCompositionArb = fc.record({
  resourceType: fc.constant('Composition' as const),
  status: compositionStatusArb,
  type: codeableConceptArb,
  subject: referenceArb,
  date: fc.date().map((d) => d.toISOString()),
  author: fc.array(referenceArb, { minLength: 1, maxLength: 3 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
})

const fullCompositionArb = fc.record({
  resourceType: fc.constant('Composition' as const),
  id: fc
    .option(
      fc.uuid().map((id) => id as typeof CompositionId.Type),
      {
        nil: undefined,
      }
    )
    .map((v) => v ?? undefined),
  status: compositionStatusArb,
  type: codeableConceptArb,
  class: fc.option(codeableConceptArb, { nil: undefined }),
  subject: referenceArb,
  encounter: fc.option(referenceArb, { nil: undefined }),
  date: fc.date().map((d) => d.toISOString()),
  author: fc.array(referenceArb, { minLength: 1, maxLength: 3 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  confidentiality: fc.option(
    fc.string({ minLength: 1, maxLength: 1 }).map((s) => Code.make(s)),
    { nil: undefined }
  ),
  custodian: fc.option(referenceArb, { nil: undefined }),
  section: fc.option(fc.array(sectionArb, { maxLength: 5 }), {
    nil: undefined,
  }),
})

describe('Composition property-based tests', () => {
  it('should create valid minimal Compositions with various inputs', () => {
    fc.assert(
      fc.property(minimalCompositionArb, (comp) => {
        const result = Composition.make(comp)
        expect(result.resourceType).toBe('Composition')
        expect(result.status).toBe(comp.status)
        expect(result.title).toBe(comp.title)
        expect(result.author).toHaveLength(comp.author.length)
      }),
      { numRuns: 100 }
    )
  })

  it('should create valid full Compositions with optional fields', () => {
    fc.assert(
      fc.property(fullCompositionArb, (comp) => {
        const result = Composition.make(comp)
        expect(result.resourceType).toBe('Composition')
        expect(result.status).toBe(comp.status)
        expect(result.title).toBe(comp.title)
        if (comp.id !== undefined) {
          expect(result.id).toBe(comp.id)
        }
        if (comp.section !== undefined) {
          expect(result.section).toHaveLength(comp.section.length)
        }
      }),
      { numRuns: 50 }
    )
  })

  it('should support all status values', () => {
    fc.assert(
      fc.property(
        compositionStatusArb,
        minimalCompositionArb,
        (status, comp) => {
          const composition = { ...comp, status }
          const result = Composition.make(composition)
          expect(result.status).toBe(status)
        }
      )
    )
  })

  it('should handle nested sections correctly', () => {
    fc.assert(
      fc.property(
        minimalCompositionArb,
        fc.array(sectionArb, { minLength: 1, maxLength: 3 }),
        (comp, sections) => {
          const composition = { ...comp, section: sections }
          const result = Composition.make(composition)
          expect(result.section).toHaveLength(sections.length)
          // Check that nested sections are preserved
          sections.forEach((section, idx) => {
            if (section.section !== undefined) {
              expect(result.section?.[idx]?.section).toBeDefined()
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('Section property-based tests', () => {
  it('should create valid Sections with various inputs', () => {
    fc.assert(
      fc.property(sectionArb, (section) => {
        const result = Section.make(section)
        expect(result).toBeDefined()
        if (section.title !== undefined) {
          expect(result.title).toBe(section.title)
        }
        if (section.mode !== undefined) {
          expect(result.mode).toBe(section.mode)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should support all mode values', () => {
    fc.assert(
      fc.property(sectionModeArb, (mode) => {
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

  it('should handle sections with multiple entries', () => {
    fc.assert(
      fc.property(
        fc.array(referenceArb, { minLength: 1, maxLength: 10 }),
        (entries) => {
          const section = Section.make({ entry: entries })
          expect(section.entry).toHaveLength(entries.length)
          entries.forEach((entry, idx) => {
            expect(section.entry?.[idx]?.reference).toBe(entry.reference)
          })
        }
      )
    )
  })
})

describe('FHIR R4 compatibility', () => {
  it('should validate that Composition schema matches FHIR R4 structure', () => {
    // This test validates at compile-time that our Composition.Encoded type
    // is structurally compatible with FHIR Composition requirements
    fc.assert(
      fc.property(minimalCompositionArb, (comp) => {
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
