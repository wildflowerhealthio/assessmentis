import { Arbitrary, FastCheck, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { LocationFormData } from './location-form-data'

const locationFormArb = Arbitrary.make(LocationFormData)

describe('LocationFormData', () => {
  it('should encode and decode (round-trip)', () => {
    FastCheck.assert(
      FastCheck.property(locationFormArb, (formData) => {
        const encoded = Schema.encodeSync(LocationFormData)(formData)
        const decoded = Schema.decodeSync(LocationFormData)(encoded)
        expect(decoded).toEqual(formData)
      }),
      { numRuns: 100 }
    )
  })

  it('should require name field', () => {
    expect(() => Schema.decodeUnknownSync(LocationFormData)({})).toThrow()
  })

  describe('toCreatePayload', () => {
    it('should transform form data to Location domain model', () => {
      const formData = LocationFormData.make({
        description: 'Main clinic entrance',
        identifierSystem: 'urn:example:location',
        identifierValue: 'clinic-a',
        mode: 'instance',
        name: 'Clinic A',
        status: 'active',
      })

      const result = formData.toCreatePayload()
      expect(result).toEqual(
        expect.objectContaining({
          description: 'Main clinic entrance',
          domainType: 'Location',
          identifier: [
            expect.objectContaining({
              domainType: 'Identifier',
              system: 'urn:example:location',
              value: 'clinic-a',
            }),
          ],
          mode: 'instance',
          name: 'Clinic A',
          status: 'active',
        })
      )
    })

    it('should transform any valid form data without throwing', () => {
      FastCheck.assert(
        FastCheck.property(locationFormArb, (formData) => {
          const location = formData.toCreatePayload()

          expect(location.domainType).toBe('Location')
          expect(location.status).toBe(formData.status)
          expect(location.mode).toBe(formData.mode)
        }),
        { numRuns: 100 }
      )
    })
  })
})
