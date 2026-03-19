import { FastCheck, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { Practitioner } from '@assessmentis/clinical-domain'
import type { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'

import { PatientFormData } from './patient-form-data'

describe('PatientFormData', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: typeof PatientFormData.Encoded = {
        birthDate: new Date('1990-01-01'),
        familyName: 'Doe',
        gender: 'male',
        givenName: 'John',
        practitionerUrl: 'http://example.com/fhir/Practitioner/prac-123',
      }

      const result = Schema.decodeUnknownSync(PatientFormData)(validData)
      expect(result).toMatchObject({
        birthDate: new Date('1990-01-01'),
        familyName: 'Doe',
        gender: 'male',
        givenName: 'John',
      })
      expect(result.practitionerUrl?.toString()).toBe(
        'http://example.com/fhir/Practitioner/prac-123'
      )
    })

    it('should require givenName and familyName', () => {
      const invalidData = {
        gender: 'male',
      }

      expect(() => Schema.decodeUnknownSync(PatientFormData)(invalidData)).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        familyName: 'Smith',
        givenName: 'Jane',
      }

      const result = Schema.decodeUnknownSync(PatientFormData)(minimalData)
      expect(result.gender).toBeUndefined()
      expect(result.birthDate).toBeUndefined()
      expect(result.practitionerUrl).toBeUndefined()
    })
  })

  describe('toCreatePayload', () => {
    it('should transform form data to Patient domain model', () => {
      const formData = PatientFormData.make({
        birthDate: new Date('1990-01-01'),
        familyName: 'Doe',
        gender: 'male',
        givenName: 'John',
        practitionerUrl: Schema.decodeSync(Practitioner.UrlSchema)(
          'http://example.com/fhir/Practitioner/prac-123'
        ),
      })

      const patient = formData.toCreatePayload()

      expect(patient).toMatchObject({
        active: true,
        birthDate: new Date('1990-01-01'),
        domainType: 'Patient',
        gender: 'male',
        generalPractitioner: [
          {
            reference: 'http://example.com/fhir/Practitioner/prac-123',
          },
        ],
        name: [
          {
            given: ['John'],
            family: 'Doe',
          },
        ],
      })
    })

    it('should handle missing optional fields', () => {
      const formData = PatientFormData.make({
        familyName: 'Smith',
        givenName: 'Jane',
      })

      const patient = formData.toCreatePayload()

      expect(patient.gender).toBeUndefined()
      expect(patient.birthDate).toBeUndefined()
      expect(patient.generalPractitioner).toBeUndefined()
      expect(patient.active).toBe(true)
    })

    it('should handle empty strings correctly', () => {
      const formData = PatientFormData.make({
        birthDate: undefined,
        familyName: 'Doe',
        givenName: '',
      })

      const patient = formData.toCreatePayload()

      expect(patient.name).toEqual([
        {
          family: 'Doe',
          given: undefined,
        },
      ])
      expect(patient.birthDate).toBe(undefined)
    })
  })

  describe('property-based tests', () => {
    it('should transform any valid form data to Patient without throwing', () => {
      const genGender = FastCheck.constantFrom<AdministrativeGender>(
        'male',
        'female',
        'other',
        'unknown'
      )

      const genFormData = FastCheck.record({
        birthDate: FastCheck.option(
          FastCheck.date()
            .map((d) => d.toISOString().split('T')[0])
            .filter((s) => s.length === 10)
            .map((s) => new Date(s)),
          { nil: undefined }
        ),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        practitionerUrl: FastCheck.option(FastCheck.webUrl(), {
          nil: undefined,
        }),
      }).map((x) => Schema.decodeSync(PatientFormData)(x))

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const patient = formData.toCreatePayload()

          expect(patient.domainType).toBe('Patient')
          expect(patient.active).toBe(true)

          if (formData.givenName.trim() || formData.familyName.trim()) {
            expect(patient.name).toBeDefined()
            expect(Array.isArray(patient.name)).toBe(true)
          }

          if (formData.practitionerUrl) {
            expect(patient.generalPractitioner).toBeDefined()
            expect(patient.generalPractitioner?.[0].reference).toBe(
              formData.practitionerUrl.toString()
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain field values through transformation', () => {
      const genGender = FastCheck.constantFrom<AdministrativeGender>(
        'male',
        'female',
        'other',
        'unknown'
      )

      const genFormData = FastCheck.record({
        birthDate: FastCheck.option(
          FastCheck.date()
            .map((d) => d.toISOString().split('T')[0])
            .filter((s) => s.length === 10)
            .map((s) => new Date(s)),
          { nil: undefined }
        ),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        practitionerUrl: FastCheck.option(FastCheck.webUrl(), {
          nil: undefined,
        }),
      }).map((x) => Schema.decodeSync(PatientFormData)(x))

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const patient = formData.toCreatePayload()

          expect(patient.gender).toBe(formData.gender)
          expect(patient.birthDate).toBe(formData.birthDate)

          if (formData.givenName.trim().length > 0) {
            expect(patient.name?.[0]?.given?.[0].trim() ?? undefined).toBe(
              formData.givenName.trim()
            )
          }

          if (formData.familyName.trim().length > 0) {
            expect(patient.name?.[0]?.family).toBe(formData.familyName.trim())
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
