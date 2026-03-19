import { Arbitrary, FastCheck, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { DatatypeChoice } from '@assessmentis/clinical-domain/data-types'

import { ObservationFormData } from './observation-form-data'

const observationFormArb = Arbitrary.make(ObservationFormData)

describe('ObservationFormData', () => {
  it('should encode and decode (round-trip)', () => {
    FastCheck.assert(
      FastCheck.property(observationFormArb, (formData) => {
        const encoded = Schema.encodeSync(ObservationFormData)(formData)
        const decoded = Schema.decodeSync(ObservationFormData)(encoded)
        expect(decoded).toEqual(formData)
      }),
      { numRuns: 100 }
    )
  })

  it('should require code field', () => {
    const invalidData = {
      valueString: 'some value',
    }

    expect(() => Schema.decodeUnknownSync(ObservationFormData)(invalidData)).toThrow()
  })

  describe('toCreatePayload', () => {
    it('should transform form data with valueString', () => {
      const formData = Schema.decodeSync(ObservationFormData)({
        code: 'Blood Pressure',
        encounterUrl: 'http://encounters.com/encounter-456',
        patientUrl: 'http://patients.com/patient-123',
        valueString: '120/80',
        valueType: 'valueString',
      })

      const observation = formData.toCreatePayload()

      expect(observation.domainType).toBe('Observation')
      expect(observation.status).toBe('preliminary')
      expect(observation.code.text).toBe('Blood Pressure')
      expect(observation.subject).toEqual({
        domainType: 'Reference',
        extension: [],
        reference: 'http://patients.com/patient-123',
      })
      expect(observation.encounter).toEqual({
        domainType: 'Reference',
        extension: [],
        reference: 'http://encounters.com/encounter-456',
      })
      expect(DatatypeChoice.cases(observation.value).string).toBe('120/80')
    })

    it('should transform form data with valueQuantity', () => {
      const formData = ObservationFormData.make({
        code: 'Weight',
        valueQuantityUnit: 'kg',
        valueQuantityValue: '70.5',
        valueType: 'valueQuantity',
      })

      const observation = formData.toCreatePayload()

      expect(DatatypeChoice.cases(observation.value).Quantity).toMatchObject({
        unit: 'kg',
        value: 70.5,
      })
    })

    it('should transform form data with valueCodeableConcept', () => {
      const formData = ObservationFormData.make({
        code: 'Pain Level',
        valueCodeableConceptCodingCode: 'moderate',
        valueCodeableConceptCodingDisplay: 'Moderate',
        valueCodeableConceptCodingSystem: 'http://example.org/pain-scale',
        valueCodeableConceptText: 'Moderate pain',
        valueType: 'valueCodeableConcept',
      })

      const observation = formData.toCreatePayload()

      expect(DatatypeChoice.cases(observation.value).CodeableConcept).toMatchObject({
        coding: [
          {
            system: 'http://example.org/pain-scale',
            code: 'moderate',
            display: 'Moderate',
          },
        ],
        text: 'Moderate pain',
      })
    })

    it('should transform any valid form data without throwing', () => {
      FastCheck.assert(
        FastCheck.property(observationFormArb, (formData) => {
          const observation = formData.toCreatePayload()

          expect(observation.domainType).toBe('Observation')
          expect(observation.status).toBe('preliminary')
          expect(observation.code.text).toBe(formData.code)

          if (formData.patientUrl) {
            expect(observation.subject?.reference).toBe(formData.patientUrl.toString())
          }

          if (formData.encounterUrl) {
            expect(observation.encounter?.reference).toBe(formData.encounterUrl.toString())
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
