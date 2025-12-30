import { describe, it, expect } from 'vitest'
import { Schema, FastCheck, DateTime } from 'effect'
import {
  EncounterFormSchema,
  EncounterFormData,
} from './EncounterFormSchema'

describe('EncounterFormSchema', () => {
  describe('schema validation', () => {
    it('should validate correct form data with all fields', () => {
      const periodStart = DateTime.unsafeMakeZoned('2024-01-01T10:00:00Z', {
        timeZone: 'UTC',
      })
      const periodEnd = DateTime.unsafeMakeZoned('2024-01-01T11:00:00Z', {
        timeZone: 'UTC',
      })

      const validData: typeof EncounterFormSchema.Encoded = {
        patientId: 'patient-123',
        practitionerIds: ['practitioner-456', 'practitioner-789'],
        questionnaireIds: ['questionnaire-abc', 'questionnaire-def'],
        periodStart,
        periodEnd,
        locationDisplay: 'Virtual Room A',
      }

      const result = Schema.decodeUnknownSync(EncounterFormSchema)(validData)
      expect(result.patientId).toBe('patient-123')
      expect(result.practitionerIds).toEqual([
        'practitioner-456',
        'practitioner-789',
      ])
      expect(result.questionnaireIds).toEqual([
        'questionnaire-abc',
        'questionnaire-def',
      ])
      expect(result.locationDisplay).toBe('Virtual Room A')
    })

    it('should require questionnaireIds', () => {
      const invalidData = {
        patientId: 'patient-123',
      }

      expect(() =>
        Schema.decodeUnknownSync(EncounterFormSchema)(invalidData)
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        questionnaireIds: ['questionnaire-123'],
      }

      const result =
        Schema.decodeUnknownSync(EncounterFormSchema)(minimalData)
      expect(result.patientId).toBeUndefined()
      expect(result.practitionerIds).toBeUndefined()
      expect(result.periodStart).toBeUndefined()
      expect(result.periodEnd).toBeUndefined()
      expect(result.locationDisplay).toBeUndefined()
    })

    it('should allow empty practitionerIds array', () => {
      const validData = {
        questionnaireIds: ['questionnaire-123'],
        practitionerIds: [],
      }

      const result = Schema.decodeUnknownSync(EncounterFormSchema)(validData)
      expect(result.practitionerIds).toEqual([])
    })

    it('should handle multiple questionnaireIds', () => {
      const validData = {
        questionnaireIds: ['q1', 'q2', 'q3'],
      }

      const result = Schema.decodeUnknownSync(EncounterFormSchema)(validData)
      expect(result.questionnaireIds).toEqual(['q1', 'q2', 'q3'])
    })
  })

  describe('property-based tests', () => {
    it('should validate any valid form data without throwing', () => {
      const genFormData = FastCheck.record({
        patientId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        practitionerIds: FastCheck.option(
          FastCheck.array(FastCheck.uuid(), { maxLength: 5 }),
          { nil: undefined }
        ),
        questionnaireIds: FastCheck.array(FastCheck.uuid(), {
          minLength: 1,
          maxLength: 10,
        }),
        periodStart: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
        periodEnd: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
        locationDisplay: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          // Should not throw
          const result = Schema.decodeUnknownSync(EncounterFormSchema)(
            formData as typeof EncounterFormSchema.Encoded
          )

          // Verify questionnaireIds is always present
          expect(result.questionnaireIds).toBeDefined()
          expect(Array.isArray(result.questionnaireIds)).toBe(true)
          expect(result.questionnaireIds.length).toBeGreaterThan(0)

          // If patientId exists, it should be preserved
          if (formData.patientId) {
            expect(result.patientId).toBe(formData.patientId)
          }

          // If practitionerIds exists, it should be preserved
          if (formData.practitionerIds) {
            expect(result.practitionerIds).toEqual(formData.practitionerIds)
          }

          // If locationDisplay exists, it should be preserved
          if (formData.locationDisplay) {
            expect(result.locationDisplay).toBe(formData.locationDisplay)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain field values through validation', () => {
      const genFormData = FastCheck.record({
        patientId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        practitionerIds: FastCheck.option(
          FastCheck.array(FastCheck.uuid(), { minLength: 1, maxLength: 3 }),
          { nil: undefined }
        ),
        questionnaireIds: FastCheck.array(FastCheck.uuid(), {
          minLength: 1,
          maxLength: 5,
        }),
        periodStart: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
        periodEnd: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
        locationDisplay: FastCheck.option(
          FastCheck.string({ minLength: 1, maxLength: 100 }),
          { nil: undefined }
        ),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const result = Schema.decodeUnknownSync(EncounterFormSchema)(
            formData as typeof EncounterFormSchema.Encoded
          )

          // All fields should be preserved exactly
          expect(result.patientId).toBe(formData.patientId)
          expect(result.practitionerIds).toEqual(formData.practitionerIds)
          expect(result.questionnaireIds).toEqual(formData.questionnaireIds)
          expect(result.locationDisplay).toBe(formData.locationDisplay)

          // Period dates should be preserved (as DateTimeZoned objects)
          if (formData.periodStart) {
            expect(result.periodStart).toBeDefined()
          }
          if (formData.periodEnd) {
            expect(result.periodEnd).toBeDefined()
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
