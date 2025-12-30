import { describe, it, expect } from 'vitest'
import { Arbitrary, Schema, FastCheck } from 'effect'
import {
  EncounterFormSchema,
  EncounterFormData,
} from './EncounterFormSchema'

const encounterFormArb = Arbitrary.make(EncounterFormSchema)

describe('EncounterFormSchema', () => {
  it('should encode and decode (round-trip)', () => {
    FastCheck.assert(
      FastCheck.property(encounterFormArb, (formData) => {
        const encoded = Schema.encodeSync(EncounterFormSchema)(formData)
        const decoded = Schema.decodeSync(EncounterFormSchema)(encoded)
        expect(decoded).toEqual(formData)
      }),
      { numRuns: 100 }
    )
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

    const result = Schema.decodeUnknownSync(EncounterFormSchema)(minimalData)
    expect(result.patientId).toBeUndefined()
    expect(result.practitionerIds).toBeUndefined()
    expect(result.periodStart).toBeUndefined()
    expect(result.periodEnd).toBeUndefined()
    expect(result.locationDisplay).toBeUndefined()
  })
})
