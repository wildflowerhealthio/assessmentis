import { FastCheck, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import type { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'

import { PractitionerFormData } from './practitioner-form-data'

describe('PractitionerFormData', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: typeof PractitionerFormData.Encoded = {
        familyName: 'Doe',
        gender: 'female',
        givenName: 'Jane',
        qualification: 'MD',
      }

      const result = Schema.decodeUnknownSync(PractitionerFormData)(validData)
      expect(result).toEqual(validData)
    })

    it('should require givenName and familyName', () => {
      const invalidData = {
        gender: 'male',
      }

      expect(() => Schema.decodeUnknownSync(PractitionerFormData)(invalidData)).toThrow()
    })
  })

  describe('toCreatePayload', () => {
    it('should transform form data to Practitioner domain model', () => {
      const formData = PractitionerFormData.make({
        familyName: 'Smith',
        gender: 'female',
        givenName: 'Jane',
        qualification: 'MD, Cardiology',
      })

      const practitioner = formData.toCreatePayload()

      expect(practitioner).toMatchObject({
        active: true,
        domainType: 'Practitioner',
        gender: 'female',
        name: [
          {
            given: ['Jane'],
            family: 'Smith',
          },
        ],
        qualification: [
          {
            code: {
              text: 'MD, Cardiology',
            },
          },
        ],
      })
    })

    it('should handle missing optional fields', () => {
      const formData = PractitionerFormData.make({
        familyName: 'Doe',
        givenName: 'John',
      })

      const practitioner = formData.toCreatePayload()

      expect(practitioner.gender).toBeUndefined()
      expect(practitioner.qualification).toBeUndefined()
      expect(practitioner.active).toBe(true)
    })
  })

  describe('property-based tests', () => {
    it('should transform any valid form data without throwing', () => {
      const genGender = FastCheck.constantFrom<AdministrativeGender>(
        'male',
        'female',
        'other',
        'unknown'
      )

      const genFormData = FastCheck.record({
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        qualification: FastCheck.option(FastCheck.string(), { nil: undefined }),
      }).map((x) => Schema.decodeSync(PractitionerFormData)(x))

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const practitioner = formData.toCreatePayload()

          expect(practitioner.domainType).toBe('Practitioner')
          expect(practitioner.active).toBe(true)

          if (formData.givenName.trim() || formData.familyName.trim()) {
            expect(practitioner.name).toBeDefined()
          }

          if (formData.qualification?.trim().length) {
            expect(practitioner.qualification).toBeDefined()
            expect(practitioner.qualification?.[0].code.text).toBe(formData.qualification.trim())
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
