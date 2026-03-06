import { describe, expect, it } from 'vitest'
import { FastCheck, Schema } from 'effect'

import type { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'

import { PractitionerFormData } from './PractitionerFormData'

describe('PractitionerFormData', () => {
  describe('schema validation', () => {
    it('should validate correct form data', () => {
      const validData: typeof PractitionerFormData.Encoded = {
        givenName: 'Jane',
        familyName: 'Doe',
        gender: 'female',
        qualification: 'MD',
      }

      const result = Schema.decodeUnknownSync(PractitionerFormData)(validData)
      expect(result).toEqual(validData)
    })

    it('should require givenName and familyName', () => {
      const invalidData = {
        gender: 'male',
      }

      expect(() =>
        Schema.decodeUnknownSync(PractitionerFormData)(invalidData)
      ).toThrow()
    })
  })

  describe('toCreatePayload', () => {
    it('should transform form data to Practitioner domain model', () => {
      const formData = PractitionerFormData.make({
        givenName: 'Jane',
        familyName: 'Smith',
        gender: 'female',
        qualification: 'MD, Cardiology',
      })

      const practitioner = formData.toCreatePayload()

      expect(practitioner).toMatchObject({
        domainType: 'Practitioner',
        name: [
          {
            given: ['Jane'],
            family: 'Smith',
          },
        ],
        gender: 'female',
        qualification: [
          {
            code: {
              text: 'MD, Cardiology',
            },
          },
        ],
        active: true,
      })
    })

    it('should handle missing optional fields', () => {
      const formData = PractitionerFormData.make({
        givenName: 'John',
        familyName: 'Doe',
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
        givenName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        familyName: FastCheck.string({ minLength: 1, maxLength: 50 }),
        gender: FastCheck.option(genGender, { nil: undefined }),
        qualification: FastCheck.option(FastCheck.string(), { nil: undefined }),
      }).map(Schema.decodeSync(PractitionerFormData))

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
            expect(practitioner.qualification?.[0].code.text).toBe(
              formData.qualification.trim()
            )
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
