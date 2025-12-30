import { describe, it, expect } from 'vitest'
import { Schema, FastCheck, DateTime } from 'effect'
import {
  ObservationFormSchema,
  ObservationFormData,
  transformToObservation,
  ValueTypeEnum,
} from './ObservationFormSchema'

describe('ObservationFormSchema', () => {
  describe('schema validation', () => {
    it('should validate correct form data with valueString', () => {
      const effectiveDateTime = DateTime.unsafeMakeZoned(
        '2024-01-01T10:00:00Z',
        { timeZone: 'UTC' }
      )

      const validData: typeof ObservationFormSchema.Encoded = {
        patientId: 'patient-123',
        encounterId: 'encounter-456',
        code: 'Blood Pressure',
        valueType: 'valueString',
        valueString: '120/80',
        effectiveDateTime,
      }

      const result = Schema.decodeUnknownSync(ObservationFormSchema)(validData)
      expect(result.code).toBe('Blood Pressure')
      expect(result.valueType).toBe('valueString')
      expect(result.valueString).toBe('120/80')
    })

    it('should validate correct form data with valueDecimal', () => {
      const validData: typeof ObservationFormSchema.Encoded = {
        code: 'Temperature',
        valueType: 'valueDecimal',
        valueDecimal: '98.6',
      }

      const result = Schema.decodeUnknownSync(ObservationFormSchema)(validData)
      expect(result.valueType).toBe('valueDecimal')
      expect(result.valueDecimal).toBe('98.6')
    })

    it('should validate correct form data with valueQuantity', () => {
      const validData: typeof ObservationFormSchema.Encoded = {
        code: 'Weight',
        valueType: 'valueQuantity',
        valueQuantityValue: '70.5',
        valueQuantityUnit: 'kg',
      }

      const result = Schema.decodeUnknownSync(ObservationFormSchema)(validData)
      expect(result.valueType).toBe('valueQuantity')
      expect(result.valueQuantityValue).toBe('70.5')
      expect(result.valueQuantityUnit).toBe('kg')
    })

    it('should validate correct form data with valueCodeableConcept', () => {
      const validData: typeof ObservationFormSchema.Encoded = {
        code: 'Pain Level',
        valueType: 'valueCodeableConcept',
        valueCodeableConceptText: 'Moderate pain',
        valueCodeableConceptCodingCode: 'moderate',
        valueCodeableConceptCodingSystem: 'http://example.org/pain-scale',
        valueCodeableConceptCodingDisplay: 'Moderate',
      }

      const result = Schema.decodeUnknownSync(ObservationFormSchema)(validData)
      expect(result.valueType).toBe('valueCodeableConcept')
      expect(result.valueCodeableConceptText).toBe('Moderate pain')
    })

    it('should require code field', () => {
      const invalidData = {
        valueString: 'some value',
      }

      expect(() =>
        Schema.decodeUnknownSync(ObservationFormSchema)(invalidData)
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const minimalData = {
        code: 'Observation Code',
      }

      const result =
        Schema.decodeUnknownSync(ObservationFormSchema)(minimalData)
      expect(result.patientId).toBeUndefined()
      expect(result.encounterId).toBeUndefined()
      expect(result.valueType).toBeUndefined()
      expect(result.effectiveDateTime).toBeUndefined()
    })
  })

  describe('transformToObservation', () => {
    it('should transform form data with valueString', () => {
      const formData: ObservationFormData = {
        patientId: 'patient-123',
        encounterId: 'encounter-456',
        code: 'Blood Pressure',
        valueType: 'valueString',
        valueString: '120/80',
      }

      const observation = transformToObservation(formData)

      expect(observation).toMatchObject({
        resourceType: 'Observation',
        status: 'preliminary',
        code: {
          text: 'Blood Pressure',
          coding: [],
        },
        subject: { reference: 'Patient/patient-123' },
        encounter: { reference: 'Encounter/encounter-456' },
        valueString: '120/80',
      })
    })

    it('should transform form data with valueDecimal', () => {
      const formData: ObservationFormData = {
        code: 'Temperature',
        valueType: 'valueDecimal',
        valueDecimal: '98.6',
      }

      const observation = transformToObservation(formData)

      expect(observation.resourceType).toBe('Observation')
      expect(observation.valueDecimal).toBe(98.6)
      expect(observation.subject).toBeUndefined()
      expect(observation.encounter).toBeUndefined()
    })

    it('should transform form data with valueQuantity', () => {
      const formData: ObservationFormData = {
        code: 'Weight',
        valueType: 'valueQuantity',
        valueQuantityValue: '70.5',
        valueQuantityUnit: 'kg',
      }

      const observation = transformToObservation(formData)

      expect(observation.resourceType).toBe('Observation')
      expect(observation.valueQuantity).toEqual({
        value: 70.5,
        unit: 'kg',
      })
    })

    it('should transform form data with valueCodeableConcept', () => {
      const formData: ObservationFormData = {
        code: 'Pain Level',
        valueType: 'valueCodeableConcept',
        valueCodeableConceptText: 'Moderate pain',
        valueCodeableConceptCodingCode: 'moderate',
        valueCodeableConceptCodingSystem: 'http://example.org/pain-scale',
        valueCodeableConceptCodingDisplay: 'Moderate',
      }

      const observation = transformToObservation(formData)

      expect(observation.valueCodeableConcept).toEqual({
        text: 'Moderate pain',
        coding: [
          {
            system: 'http://example.org/pain-scale',
            code: 'moderate',
            display: 'Moderate',
          },
        ],
      })
    })

    it('should handle missing optional fields', () => {
      const formData: ObservationFormData = {
        code: 'Basic Observation',
      }

      const observation = transformToObservation(formData)

      expect(observation.resourceType).toBe('Observation')
      expect(observation.status).toBe('preliminary')
      expect(observation.code.text).toBe('Basic Observation')
      expect(observation.subject).toBeUndefined()
      expect(observation.encounter).toBeUndefined()
    })

    it('should handle valueDecimal with non-numeric string gracefully', () => {
      const formData: ObservationFormData = {
        code: 'Test',
        valueType: 'valueDecimal',
        valueDecimal: 'not-a-number',
      }

      const observation = transformToObservation(formData)

      expect(observation.valueDecimal).toBeNaN()
    })

    it('should handle valueQuantity with missing value', () => {
      const formData: ObservationFormData = {
        code: 'Test',
        valueType: 'valueQuantity',
        valueQuantityUnit: 'kg',
      }

      const observation = transformToObservation(formData)

      expect(observation.valueQuantity).toEqual({
        value: undefined,
        unit: 'kg',
      })
    })

    it('should handle valueCodeableConcept without coding', () => {
      const formData: ObservationFormData = {
        code: 'Test',
        valueType: 'valueCodeableConcept',
        valueCodeableConceptText: 'Some text',
      }

      const observation = transformToObservation(formData)

      expect(observation.valueCodeableConcept).toEqual({
        text: 'Some text',
        coding: [],
      })
    })
  })

  describe('property-based tests', () => {
    it('should transform any valid form data without throwing', () => {
      const genValueType = FastCheck.constantFrom(
        'valueString',
        'valueDecimal',
        'valueQuantity',
        'valueCodeableConcept'
      )

      const genFormData = FastCheck.record({
        patientId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        encounterId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        code: FastCheck.string({ minLength: 1, maxLength: 100 }),
        valueType: FastCheck.option(genValueType, { nil: undefined }),
        valueString: FastCheck.option(FastCheck.string(), { nil: undefined }),
        valueDecimal: FastCheck.option(
          FastCheck.float({ min: 0, max: 1000 }).map((n) => n.toString()),
          { nil: undefined }
        ),
        valueQuantityValue: FastCheck.option(
          FastCheck.float({ min: 0, max: 1000 }).map((n) => n.toString()),
          { nil: undefined }
        ),
        valueQuantityUnit: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
        valueCodeableConceptText: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
        valueCodeableConceptCodingCode: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
        valueCodeableConceptCodingSystem: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
        valueCodeableConceptCodingDisplay: FastCheck.option(FastCheck.string(), {
          nil: undefined,
        }),
        effectiveDateTime: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          // Should not throw
          const observation = transformToObservation(
            formData as ObservationFormData
          )

          // Verify basic structure
          expect(observation.resourceType).toBe('Observation')
          expect(observation.status).toBe('preliminary')
          expect(observation.code).toBeDefined()
          expect(observation.code.text).toBe(formData.code)

          // If patientId exists, subject should be defined
          if (formData.patientId) {
            expect(observation.subject).toEqual({
              reference: `Patient/${formData.patientId}`,
            })
          }

          // If encounterId exists, encounter should be defined
          if (formData.encounterId) {
            expect(observation.encounter).toEqual({
              reference: `Encounter/${formData.encounterId}`,
            })
          }

          // Verify value field based on valueType
          if (formData.valueType === 'valueString') {
            expect('valueString' in observation).toBe(true)
          } else if (formData.valueType === 'valueDecimal') {
            expect('valueDecimal' in observation).toBe(true)
          } else if (formData.valueType === 'valueQuantity') {
            expect('valueQuantity' in observation).toBe(true)
          } else if (formData.valueType === 'valueCodeableConcept') {
            expect('valueCodeableConcept' in observation).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain field values through transformation', () => {
      const genFormData = FastCheck.record({
        patientId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        encounterId: FastCheck.option(FastCheck.uuid(), { nil: undefined }),
        code: FastCheck.string({ minLength: 1, maxLength: 100 }),
        valueType: FastCheck.constantFrom('valueString'),
        valueString: FastCheck.string({ minLength: 1, maxLength: 50 }),
        effectiveDateTime: FastCheck.option(
          FastCheck.date({
            min: new Date('2000-01-01'),
            max: new Date('2099-12-31'),
          }).map((d) =>
            DateTime.unsafeMakeZoned(d.toISOString(), { timeZone: 'UTC' })
          ),
          { nil: undefined }
        ),
      })

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const observation = transformToObservation(
            formData as ObservationFormData
          )

          // Code should be preserved
          expect(observation.code.text).toBe(formData.code)

          // ValueString should be preserved
          expect(observation.valueString).toBe(formData.valueString)

          // Patient and encounter references should be correct
          if (formData.patientId) {
            expect(observation.subject?.reference).toBe(
              `Patient/${formData.patientId}`
            )
          }
          if (formData.encounterId) {
            expect(observation.encounter?.reference).toBe(
              `Encounter/${formData.encounterId}`
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    it('should handle idempotent transformation for each value type', () => {
      const genFormData = FastCheck.oneof(
        // valueString
        FastCheck.record({
          code: FastCheck.string({ minLength: 1, maxLength: 50 }),
          valueType: FastCheck.constant('valueString' as const),
          valueString: FastCheck.string({ minLength: 1, maxLength: 50 }),
        }),
        // valueDecimal
        FastCheck.record({
          code: FastCheck.string({ minLength: 1, maxLength: 50 }),
          valueType: FastCheck.constant('valueDecimal' as const),
          valueDecimal: FastCheck.float({ min: 0, max: 1000 }).map((n) =>
            n.toString()
          ),
        }),
        // valueQuantity
        FastCheck.record({
          code: FastCheck.string({ minLength: 1, maxLength: 50 }),
          valueType: FastCheck.constant('valueQuantity' as const),
          valueQuantityValue: FastCheck.float({ min: 0, max: 1000 }).map((n) =>
            n.toString()
          ),
          valueQuantityUnit: FastCheck.string({ minLength: 1, maxLength: 20 }),
        }),
        // valueCodeableConcept
        FastCheck.record({
          code: FastCheck.string({ minLength: 1, maxLength: 50 }),
          valueType: FastCheck.constant('valueCodeableConcept' as const),
          valueCodeableConceptText: FastCheck.string({
            minLength: 1,
            maxLength: 50,
          }),
          valueCodeableConceptCodingCode: FastCheck.string({
            minLength: 1,
            maxLength: 20,
          }),
          valueCodeableConceptCodingSystem: FastCheck.string({
            minLength: 1,
            maxLength: 50,
          }),
          valueCodeableConceptCodingDisplay: FastCheck.string({
            minLength: 1,
            maxLength: 50,
          }),
        })
      )

      FastCheck.assert(
        FastCheck.property(genFormData, (formData) => {
          const observation = transformToObservation(
            formData as ObservationFormData
          )

          // Basic properties should always be present
          expect(observation.resourceType).toBe('Observation')
          expect(observation.status).toBe('preliminary')
          expect(observation.code.text).toBe(formData.code)

          // Value type specific assertions
          switch (formData.valueType) {
            case 'valueString':
              expect(observation.valueString).toBe(formData.valueString)
              break
            case 'valueDecimal': {
              const expectedValue = parseFloat(formData.valueDecimal)
              if (isNaN(expectedValue)) {
                expect(observation.valueDecimal).toBeNaN()
              } else {
                expect(observation.valueDecimal).toBeCloseTo(expectedValue, 2)
              }
              break
            }
            case 'valueQuantity': {
              const expectedValue = parseFloat(formData.valueQuantityValue)
              if (isNaN(expectedValue)) {
                expect(observation.valueQuantity?.value).toBeNaN()
              } else {
                expect(observation.valueQuantity?.value).toBeCloseTo(
                  expectedValue,
                  2
                )
              }
              expect(observation.valueQuantity?.unit).toBe(
                formData.valueQuantityUnit
              )
              break
            }
            case 'valueCodeableConcept':
              expect(observation.valueCodeableConcept?.text).toBe(
                formData.valueCodeableConceptText
              )
              if (formData.valueCodeableConceptCodingCode) {
                expect(
                  observation.valueCodeableConcept?.coding?.[0]?.code
                ).toBe(formData.valueCodeableConceptCodingCode)
                expect(
                  observation.valueCodeableConcept?.coding?.[0]?.system
                ).toBe(formData.valueCodeableConceptCodingSystem)
                expect(
                  observation.valueCodeableConcept?.coding?.[0]?.display
                ).toBe(formData.valueCodeableConceptCodingDisplay)
              }
              break
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
