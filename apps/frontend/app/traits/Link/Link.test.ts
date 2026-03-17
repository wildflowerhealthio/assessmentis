import { describe, expect, it } from 'vitest'
import { Schema } from 'effect'

import {
  Composition,
  Encounter,
  Location,
  Observation,
  Patient,
  Practitioner,
} from '@assessmentis/clinical-domain'

import '.'

import { assertLink } from './Link'

const decodePatient = Schema.decodeSync(Patient)
const decodeLocation = Schema.decodeSync(Location)
const decodePractitioner = Schema.decodeSync(Practitioner)
const decodeObservation = Schema.decodeSync(Observation)
const decodeComposition = Schema.decodeSync(Composition)
const decodeEncounter = Schema.decodeSync(Encounter)

const testUrlString = 'https://example.com/fhir/Patient/test-123'

describe('Link trait', () => {
  describe('class-level (collection path)', () => {
    it('Patient', () => {
      expect(Patient.Link).toBe('/Patient')
    })

    it('Practitioner', () => {
      expect(Practitioner.Link).toBe('/Practitioner')
    })

    it('Location', () => {
      expect(Location.Link).toBe('/Location')
    })

    it('Observation', () => {
      expect(Observation.Link).toBe('/Observation')
    })

    it('Composition', () => {
      expect(Composition.Link).toBe('/Composition')
    })

    it('Encounter', () => {
      expect(Encounter.Link).toBe('/Encounter')
    })
  })

  describe('instance-level (resource path)', () => {
    it('constructs href from domainType and url', () => {
      const patient = decodePatient({ url: testUrlString })
      expect(patient.Link).toBe(`/Patient/${encodeURIComponent(testUrlString)}`)
    })

    it('handles missing url', () => {
      const patient = decodePatient({})
      expect(patient.Link).toBe('/Patient')
    })

    it('works for all resource types', () => {
      const encoded = encodeURIComponent(testUrlString)
      const resources = [
        decodeLocation({ url: testUrlString }),
        decodePractitioner({ url: testUrlString }),
        decodeObservation({ status: 'final', code: {}, url: testUrlString }),
        decodeComposition({
          status: 'final',
          type: {},
          date: '2024-01-01',
          author: [],
          title: 'Test',
          url: testUrlString,
        }),
        decodeEncounter({
          status: 'in-progress',
          class: { code: 'AMB' },
          url: testUrlString,
        }),
      ]

      for (const resource of resources) {
        expect(resource.Link).toContain(encoded)
      }
    })
  })

  describe('assertLink', () => {
    it('succeeds for resources with trait', () => {
      const patient = decodePatient({})
      expect(() => assertLink(patient)).not.toThrow()
    })

    it('throws for plain objects', () => {
      expect(() => assertLink({})).toThrow('Resource missing Link trait')
    })

    it('throws for null', () => {
      expect(() => assertLink(null)).toThrow('Resource missing Link trait')
    })
  })
})
