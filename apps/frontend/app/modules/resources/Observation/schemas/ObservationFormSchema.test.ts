import { describe, it, expect } from 'vitest'
import { Arbitrary, Schema, FastCheck } from 'effect'
import type { ObservationFormData } from './ObservationFormSchema'
import {
  ObservationFormSchema,
  transformToObservation,
} from './ObservationFormSchema'

const observationFormArb = Arbitrary.make(ObservationFormSchema)

describe('ObservationFormSchema', () => {
  it('should encode and decode (round-trip)', () => {
    FastCheck.assert(
      FastCheck.property(observationFormArb, (formData) => {
        const encoded = Schema.encodeSync(ObservationFormSchema)(formData)
        const decoded = Schema.decodeSync(ObservationFormSchema)(encoded)
        expect(decoded).toEqual(formData)
      }),
      { numRuns: 100 }
    )
  })

  it('should require code field', () => {
    const invalidData = {
      valueString: 'some value',
    }

    expect(() =>
      Schema.decodeUnknownSync(ObservationFormSchema)(invalidData)
    ).toThrow()
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

      expect(observation.resourceType).toBe('Observation')
      expect(observation.status).toBe('preliminary')
      expect(observation.code.text).toBe('Blood Pressure')
      expect(observation.subject).toEqual({ reference: 'Patient/patient-123' })
      expect(observation.encounter).toEqual({
        reference: 'Encounter/encounter-456',
      })
      expect('valueString' in observation && observation.valueString).toBe(
        '120/80'
      )
    })

    it('should transform form data with valueDecimal', () => {
      const formData: ObservationFormData = {
        code: 'Temperature',
        valueType: 'valueDecimal',
        valueDecimal: '98.6',
      }

      const observation = transformToObservation(formData)

      expect(observation.resourceType).toBe('Observation')
      expect('valueDecimal' in observation && observation.valueDecimal).toBe(
        98.6
      )
    })

    it('should transform form data with valueQuantity', () => {
      const formData: ObservationFormData = {
        code: 'Weight',
        valueType: 'valueQuantity',
        valueQuantityValue: '70.5',
        valueQuantityUnit: 'kg',
      }

      const observation = transformToObservation(formData)

      expect(
        'valueQuantity' in observation && observation.valueQuantity
      ).toEqual({
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

      expect(
        'valueCodeableConcept' in observation &&
          observation.valueCodeableConcept
      ).toEqual({
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

    it('should transform any valid form data without throwing', () => {
      FastCheck.assert(
        FastCheck.property(observationFormArb, (formData) => {
          const observation = transformToObservation(formData)

          expect(observation.resourceType).toBe('Observation')
          expect(observation.status).toBe('preliminary')
          expect(observation.code.text).toBe(formData.code)

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
  })
})
