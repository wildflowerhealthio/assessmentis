import { describe, expect, it } from 'vitest'
import { Arbitrary, FastCheck, Schema } from 'effect'

import { Patient } from '@assessmentis/clinical-domain'

import { CompositionFormData } from './CompositionFormData'

const compositionFormArb = Arbitrary.make(CompositionFormData)

describe('CompositionFormData', () => {
  it('should encode and decode (round-trip)', () => {
    FastCheck.assert(
      FastCheck.property(compositionFormArb, (formData) => {
        const encoded = Schema.encodeSync(CompositionFormData)(formData)
        const decoded = Schema.decodeSync(CompositionFormData)(encoded)
        expect(decoded).toEqual(formData)
      }),
      { numRuns: 100 }
    )
  })

  describe('schema validation', () => {
    it('should require title', () => {
      expect(() =>
        Schema.decodeUnknownSync(CompositionFormData)({
          patientUrl: 'http://patients.com/patient-123',
        })
      ).toThrow()
    })

    it('should allow optional fields to be undefined', () => {
      const result = Schema.decodeUnknownSync(CompositionFormData)({
        title: 'Assessment',
      })
      expect(result.patientUrl).toBeUndefined()
    })
  })

  describe('toCreatePayload', () => {
    it('should transform form data to Composition domain model', () => {
      const formData = CompositionFormData.make({
        title: 'Medical History',
        patientUrl: Schema.decodeSync(Patient.UrlSchema)(
          'http://patients.com/patient-456'
        ),
      })

      const composition = formData.toCreatePayload()

      expect(composition.domainType).toBe('Composition')
      expect(composition.title).toBe('Medical History')
      expect(composition.status).toBe('preliminary')
      expect(composition.subject).toMatchObject({
        reference: 'http://patients.com/patient-456',
      })
      expect(composition.section).toEqual([])
    })

    it('should use default title if empty', () => {
      const formData = CompositionFormData.make({ title: '' })
      const composition = formData.toCreatePayload()
      expect(composition.title).toBe('New Composition')
    })

    it('should transform any valid form data without throwing', () => {
      FastCheck.assert(
        FastCheck.property(compositionFormArb, (formData) => {
          const composition = formData.toCreatePayload()

          expect(composition.domainType).toBe('Composition')
          expect(composition.status).toBe('preliminary')
          expect(composition.section).toEqual([])
          expect(composition.date).toBeDefined()

          if (formData.title) {
            expect(composition.title).toBe(formData.title)
          } else {
            expect(composition.title).toBe('New Composition')
          }

          if (formData.patientUrl) {
            expect(composition.subject).toEqual({
              domainType: 'Reference',
              extension: [],
              reference: formData.patientUrl.toString(),
            })
          } else {
            expect(composition.subject).toBeUndefined()
          }
        }),
        { numRuns: 100 }
      )
    })
  })

})
