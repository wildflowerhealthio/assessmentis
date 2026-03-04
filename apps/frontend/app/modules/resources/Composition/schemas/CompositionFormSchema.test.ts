import { describe, it, expect } from 'vitest'
import { Schema, FastCheck } from 'effect'
import type { CompositionFormData } from './CompositionFormSchema'
import {
  CompositionFormSchema,
  transformToComposition,
} from './CompositionFormSchema'
import { Patient } from '@assessmentis/clinical-domain'

describe('CompositionFormSchema', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: typeof CompositionFormSchema.Encoded = {
        title: 'Patient Assessment',
        patientUrl: 'http://patients.com/patient-123',
      }

      const result = Schema.decodeUnknownSync(CompositionFormSchema)(validData)
      expect(result).toMatchObject({
        title: 'Patient Assessment',
        patientUrl: {
          protocol: 'http:',
          host: 'patients.com',
          pathname: '/patient-123',
        },
      })
    })

    it('should require title', () => {
      const invalidData = {
        patientUrl: 'http://patients.com/patient-123',
      }

      expect(() =>
        Schema.decodeUnknownSync(CompositionFormSchema)(invalidData)
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        title: 'Assessment',
      }

      const result = Schema.decodeUnknownSync(CompositionFormSchema)(
        minimalData
      )
      expect(result.patientUrl).toBeUndefined()
    })
  })

  describe('transformToComposition', () => {
    it('should transform form data to Composition domain model', () => {
      const formData: CompositionFormData = {
        title: 'Medical History',
        patientUrl: Schema.decodeSync(Patient.UrlSchema)(
          'http://patients.com/patient-456'
        ),
      }

      const composition = transformToComposition(formData)

      expect(composition.domainType).toBe('Composition')
      expect(composition.title).toBe('Medical History')
      expect(composition.status).toBe('preliminary')
      expect(composition.subject).toMatchObject({
        reference: 'http://patients.com/patient-456',
      })
      expect(composition.section).toEqual([])
    })

    it('should handle missing optional fields', () => {
      const formData: CompositionFormData = {
        title: 'Quick Note',
      }

      const composition = transformToComposition(formData)

      expect(composition.title).toBe('Quick Note')
      expect(composition.subject).toBeUndefined()
      expect(composition.date).toBeDefined() // Should have current date
    })

    it('should use default title if empty', () => {
      const formData: CompositionFormData = {
        title: '',
      }

      const composition = transformToComposition(formData)

      expect(composition.title).toBe('New Composition')
    })
  })

  describe('property-based tests', () => {
    it('should transform any valid form data without throwing', () => {
      const genFormData = FastCheck.record({
        title: FastCheck.string({ minLength: 0, maxLength: 200 }),
        patientUrl: FastCheck.option(FastCheck.webUrl(), { nil: undefined }),
        date: FastCheck.option(
          FastCheck.date().map((d) => d.toISOString().split('T')[0]),
          { nil: undefined }
        ),
      }).map(Schema.decodeSync(CompositionFormSchema))

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const composition = transformToComposition(formData)

          expect(composition.domainType).toBe('Composition')
          expect(composition.status).toBe('preliminary')
          expect(composition.section).toEqual([])
          expect(composition.date).toBeDefined()

          // If title was provided and not empty, it should be used
          if (formData.title) {
            expect(composition.title).toBe(formData.title)
          } else {
            expect(composition.title).toBe('New Composition')
          }

          // If patientUrl was provided, subject should reference it
          if (formData.patientUrl) {
            expect(composition.subject).toEqual({
              domainType: 'Reference',
              extension: [],
              reference: formData.patientUrl.toString(),
            })
          } else {
            expect(composition.subject).toBeUndefined()
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain field values through transformation', () => {
      const genFormData = FastCheck.record({
        title: FastCheck.string({ minLength: 1, maxLength: 200 }),
        patientUrl: FastCheck.option(FastCheck.webUrl(), { nil: undefined }),
        date: FastCheck.option(
          FastCheck.date().map((d) => d.toISOString().split('T')[0]),
          { nil: undefined }
        ),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const composition = transformToComposition(
            formData as CompositionFormData
          )

          // Title should be preserved (not empty in this test)
          expect(composition.title).toBe(formData.title)

          // Patient URL should be in subject reference
          if (formData.patientUrl) {
            expect(composition.subject?.reference).toBe(formData.patientUrl)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
