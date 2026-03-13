import { describe, expect, it } from 'vitest'
import { FastCheck, Schema } from 'effect'

import { Practitioner } from '@assessmentis/clinical-domain'
import type { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'

import { PatientFormData } from './PatientFormData'

describe('PatientFormData', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: typeof PatientFormData.Encoded = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        practitionerUrl: 'http://example.com/fhir/Practitioner/prac-123',
      }

      const result = Schema.decodeUnknownSync(PatientFormData)(validData)
      expect(result).toMatchObject({
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
      })
      expect(result.practitionerUrl?.toString()).toBe(
        'http://example.com/fhir/Practitioner/prac-123'
      )
    })

    it('should require givenName and familyName', () => {
      const invalidData = {
        gender: 'male',
      }

      expect(() =>
        Schema.decodeUnknownSync(PatientFormData)(invalidData)
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        givenName: 'Jane',
        familyName: 'Smith',
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
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        practitionerUrl: Schema.decodeSync(Practitioner.UrlSchema)(
          'http://example.com/fhir/Practitioner/prac-123'
        ),
      })

      const patient = formData.toCreatePayload()

      expect(patient).toMatchObject({
        domainType: 'Patient',
        name: [
          {
            given: ['John'],
            family: 'Doe',
          },
        ],
        gender: 'male',
        birthDate: new Date('1990-01-01'),
        generalPractitioner: [
          {
            reference: 'http://example.com/fhir/Practitioner/prac-123',
          },
        ],
        active: true,
      })
    })

    it('should handle missing optional fields', () => {
      const formData = PatientFormData.make({
        givenName: 'Jane',
        familyName: 'Smith',
      })

      const patient = formData.toCreatePayload()

      expect(patient.gender).toBeUndefined()
      expect(patient.birthDate).toBeUndefined()
      expect(patient.generalPractitioner).toBeUndefined()
      expect(patient.active).toBe(true)
    })

    it('should handle empty strings correctly', () => {
      const formData = PatientFormData.make({
        givenName: '',
        familyName: 'Doe',
        birthDate: undefined,
      })

      const patient = formData.toCreatePayload()

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
        birthDate: FastCheck.option(
          FastCheck.date()
            .map((d) => d.toISOString().split('T')[0])
            .filter((s) => s.length === 10)
            .map((s) => new Date(s)),
          { nil: undefined }
        ),
        practitionerUrl: FastCheck.option(FastCheck.webUrl(), {
          nil: undefined,
        }),
      }).map(Schema.decodeSync(PatientFormData))

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
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        birthDate: FastCheck.option(
          FastCheck.date()
            .map((d) => d.toISOString().split('T')[0])
            .filter((s) => s.length === 10)
            .map((s) => new Date(s)),
          { nil: undefined }
        ),
        practitionerUrl: FastCheck.option(FastCheck.webUrl(), {
          nil: undefined,
        }),
      }).map(Schema.decodeSync(PatientFormData))

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const patient = formData.toCreatePayload()

          expect(patient.gender).toBe(formData.gender)
          expect(patient.birthDate).toBe(formData.birthDate)

          if (formData.givenName.trim().length) {
            expect(patient.name?.[0]?.given?.[0].trim() || undefined).toBe(
              formData.givenName.trim()
            )
          }

          if (formData.familyName.trim().length) {
            expect(patient.name?.[0]?.family).toBe(formData.familyName.trim())
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
