import { describe, it, expect } from 'vitest'
import { Schema, FastCheck } from 'effect'
import type { PatientFormData } from './PatientFormSchema'
import { PatientFormSchema, transformToPatient } from './PatientFormSchema'
import type { AdministrativeGender } from '@assessmentis/clinical-domain/administration'

// NOTE: This test requires vitest to be installed
// Run: npm install --save-dev vitest @effect/vitest

describe('PatientFormSchema', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: PatientFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        practitionerId: 'practitioner-123',
      }

      const result = Schema.decodeUnknownSync(PatientFormSchema)(validData)
      expect(result).toEqual(validData)
    })

    it('should require givenName and familyName', () => {
      const invalidData = {
        gender: 'male',
      }

      expect(() =>
        Schema.decodeUnknownSync(PatientFormSchema)(invalidData)
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        givenName: 'Jane',
        familyName: 'Smith',
      }

      const result = Schema.decodeUnknownSync(PatientFormSchema)(minimalData)
      expect(result.gender).toBeUndefined()
      expect(result.birthDate).toBeUndefined()
      expect(result.practitionerId).toBeUndefined()
    })
  })

  describe('transformToPatient', () => {
    it('should transform form data to Patient domain model', () => {
      const formData: PatientFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        practitionerId: 'prac-123',
      }

      const patient = transformToPatient(formData)

      expect(patient).toEqual({
        resourceType: 'Patient',
        name: [
          {
            given: ['John'],
            family: 'Doe',
          },
        ],
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        generalPractitioner: [{ reference: 'Practitioner/prac-123' }],
        active: true,
      })
    })

    it('should handle missing optional fields', () => {
      const formData: PatientFormData = {
        givenName: 'Jane',
        familyName: 'Smith',
      }

      const patient = transformToPatient(formData)

      expect(patient.gender).toBeUndefined()
      expect(patient.birthDate).toBeUndefined()
      expect(patient.generalPractitioner).toBeUndefined()
      expect(patient.active).toBe(true)
    })

    it('should handle empty strings correctly', () => {
      const formData: PatientFormData = {
        givenName: '',
        familyName: 'Doe',
        birthDate: undefined,
      }

      const patient = transformToPatient(formData)

      expect(patient.name).toEqual([
        {
          given: undefined,
          family: 'Doe',
        },
      ])
      expect(patient.birthDate).toBe(undefined)
    })
  })

  describe('property-based tests', () => {
    // Property-based test: any valid form data should transform to a valid Patient
    it('should transform any valid form data to Patient without throwing', () => {
      const genGender = FastCheck.constantFrom<AdministrativeGender>(
        'male',
        'female',
        'other',
        'unknown'
      )

      const genFormData = FastCheck.record({
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        birthDate: FastCheck.option(FastCheck.string(), { nil: undefined }),
        practitionerId: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          // Should not throw
          const patient = transformToPatient(formData as PatientFormData)

          // Verify basic structure
          expect(patient.resourceType).toBe('Patient')
          expect(patient.active).toBe(true)

          // If givenName or familyName exist, name should be defined
          if (formData.givenName || formData.familyName) {
            expect(patient.name).toBeDefined()
            expect(Array.isArray(patient.name)).toBe(true)
          }

          // If practitionerId exists, generalPractitioner should be defined
          if (formData.practitionerId) {
            expect(patient.generalPractitioner).toBeDefined()
            expect(patient.generalPractitioner?.[0].reference).toBe(
              `Practitioner/${formData.practitionerId}`
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    // Property-based test: transformation should be idempotent for the core fields
    it('should maintain field values through transformation', () => {
      const genGender = FastCheck.constantFrom<AdministrativeGender>(
        'male',
        'female',
        'other',
        'unknown'
      )

      const genFormData = FastCheck.record({
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        birthDate: FastCheck.option(
          FastCheck.date().map((d) => d.toISOString().split('T')[0]),
          { nil: undefined }
        ),
        practitionerId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const patient = transformToPatient(formData as PatientFormData)

          // Gender should be preserved
          expect(patient.gender).toBe(formData.gender)

          // Birth date should be preserved
          expect(patient.birthDate).toBe(formData.birthDate)

          // Given name should be in patient.name[0].given[0] if it exists
          if (formData.givenName.trim().length) {
            expect(patient.name?.[0]?.given?.[0].trim() || undefined).toBe(
              formData.givenName.trim()
            )
          }

          // Family name should be in patient.name[0].family
          if (formData.familyName.trim().length) {
            expect(patient.name?.[0]?.family).toBe(formData.familyName.trim())
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
