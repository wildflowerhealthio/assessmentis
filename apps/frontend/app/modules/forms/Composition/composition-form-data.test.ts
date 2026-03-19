import { Arbitrary, DateTime, Effect, FastCheck, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { Composition, Patient } from '@assessmentis/clinical-domain'
import { CodeableConcept, Reference } from '@assessmentis/clinical-domain/data-types'
import { Resource } from '@assessmentis/effectful-store'

import { CompositionFormData } from './composition-form-data'

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
        patientUrl: Schema.decodeSync(Patient.UrlSchema)('http://patients.com/patient-456'),
        title: 'Medical History',
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

  describe('toUpdatePayload', () => {
    const makeBaseComposition = (): Resource.WithResourceUrl<Composition> => {
      const url = Schema.decodeSync(Composition.UrlSchema)(
        'http://compositions.com/composition-existing'
      )
      const date = Effect.runSync(DateTime.now)
      return Composition.make({
        author: [Reference.make({ display: 'Original Author' })],
        date,
        section: [],
        status: 'final',
        subject: Reference.make({ reference: 'http://patients.com/patient-original' }),
        title: 'Original Title',
        type: CodeableConcept.make({ coding: [] }),
        url,
      }) as Resource.WithResourceUrl<Composition>
    }

    it('should preserve the url from the base composition', () => {
      const base = makeBaseComposition()
      const formData = CompositionFormData.make({
        patientUrl: Schema.decodeSync(Patient.UrlSchema)('http://patients.com/patient-999'),
        title: 'Updated Title',
      })

      const result = formData.toUpdatePayload(base)

      expect(result.url).toBe(base.url)
    })

    it('should apply form data changes to the result', () => {
      const base = makeBaseComposition()
      const formData = CompositionFormData.make({
        patientUrl: Schema.decodeSync(Patient.UrlSchema)('http://patients.com/patient-999'),
        title: 'Updated Title',
      })

      const result = formData.toUpdatePayload(base)

      expect(result.title).toBe('Updated Title')
      expect(result.subject).toMatchObject({
        reference: 'http://patients.com/patient-999',
      })
    })

    it('should preserve the date from the base composition', () => {
      const base = makeBaseComposition()
      const formData = CompositionFormData.make({ title: 'Updated Title' })

      const result = formData.toUpdatePayload(base)

      expect(result.date).toBe(base.date)
    })

    it('should produce an instance of Composition (via cloneWith)', () => {
      const base = makeBaseComposition()
      const formData = CompositionFormData.make({ title: 'Updated Title' })

      const result = formData.toUpdatePayload(base)

      expect(result).toBeInstanceOf(Composition)
      expect(result.domainType).toBe('Composition')
    })

    it('should transform any valid form data without throwing', () => {
      FastCheck.assert(
        FastCheck.property(compositionFormArb, (formData) => {
          const base = makeBaseComposition()
          const result = formData.toUpdatePayload(base)

          expect(result.url).toBe(base.url)
          expect(result.domainType).toBe('Composition')
          expect(result.date).toBe(base.date)

          if (formData.title) {
            expect(result.title).toBe(formData.title)
          } else {
            expect(result.title).toBe('New Composition')
          }

          if (formData.patientUrl) {
            expect(result.subject).toMatchObject({
              reference: formData.patientUrl.toString(),
            })
          } else {
            expect(result.subject).toBeUndefined()
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
