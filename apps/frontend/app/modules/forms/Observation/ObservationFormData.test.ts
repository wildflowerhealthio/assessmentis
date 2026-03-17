import { describe, expect, it } from 'vitest'
import { Arbitrary, FastCheck, Schema } from 'effect'

import { DatatypeChoice } from '@assessmentis/clinical-domain/data-types'

import { ObservationFormData } from './ObservationFormData'

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

    expect(() =>
      Schema.decodeUnknownSync(ObservationFormData)(invalidData)
    ).toThrow()
  })

  describe('toCreatePayload', () => {
    it('should transform form data with valueString', () => {
      const formData = Schema.decodeSync(ObservationFormData)({
        patientUrl: 'http://patients.com/patient-123',
        encounterUrl: 'http://encounters.com/encounter-456',
        code: 'Blood Pressure',
        valueType: 'valueString',
        valueString: '120/80',
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
        valueType: 'valueQuantity',
        valueQuantityValue: '70.5',
        valueQuantityUnit: 'kg',
      })

      const observation = formData.toCreatePayload()

      expect(DatatypeChoice.cases(observation.value).Quantity).toMatchObject({
        value: 70.5,
        unit: 'kg',
      })
    })

    it('should transform form data with valueCodeableConcept', () => {
      const formData = ObservationFormData.make({
        code: 'Pain Level',
        valueType: 'valueCodeableConcept',
        valueCodeableConceptText: 'Moderate pain',
        valueCodeableConceptCodingCode: 'moderate',
        valueCodeableConceptCodingSystem: 'http://example.org/pain-scale',
        valueCodeableConceptCodingDisplay: 'Moderate',
      })

      const observation = formData.toCreatePayload()

      expect(
        DatatypeChoice.cases(observation.value).CodeableConcept
      ).toMatchObject({
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
          const observation = formData.toCreatePayload()

          expect(observation.domainType).toBe('Observation')
          expect(observation.status).toBe('preliminary')
          expect(observation.code.text).toBe(formData.code)

          if (formData.patientUrl) {
            expect(observation.subject?.reference).toBe(
              formData.patientUrl.toString()
            )
          }

          if (formData.encounterUrl) {
            expect(observation.encounter?.reference).toBe(
              formData.encounterUrl.toString()
            )
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
