import { describe, expect, it } from 'vitest'
import { Arbitrary, FastCheck, Schema } from 'effect'

import { EncounterFormSchema } from './EncounterFormSchema'

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
      questionnaireUrls: ['http://questionnaires.com/questionnaire-123'],
    }

    const result = Schema.decodeUnknownSync(EncounterFormSchema)(minimalData)
    expect(result.patientUrl).toBeUndefined()
    expect(result.practitionerUrls).toBeUndefined()
    expect(result.periodStart).toBeUndefined()
    expect(result.periodEnd).toBeUndefined()
    expect(result.locationUrl).toBeUndefined()
  })
})
