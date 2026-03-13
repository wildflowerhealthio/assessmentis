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

import { assertBreadcrumbLabel } from './BreadcrumbLabel'

const decodePatient = Schema.decodeSync(Patient)
const decodeLocation = Schema.decodeSync(Location)
const decodePractitioner = Schema.decodeSync(Practitioner)
const decodeObservation = Schema.decodeSync(Observation)
const decodeComposition = Schema.decodeSync(Composition)

describe('BreadcrumbLabel trait', () => {
  describe('Patient', () => {
    it('uses formatted name', () => {
      const patient = decodePatient({
        name: [{ given: ['John'], family: 'Doe' }],
      })
      expect(patient.BreadcrumbLabel).toBe('John Doe')
    })

    it('falls back when name is missing', () => {
      const patient = decodePatient({})
      expect(patient.BreadcrumbLabel).toBe('Unnamed Patient')
    })
  })

  describe('Location', () => {
    it('uses location name', () => {
      const location = decodeLocation({ name: 'Main Office' })
      expect(location.BreadcrumbLabel).toBe('Main Office')
    })

    it('falls back to identifier', () => {
      const location = decodeLocation({
        identifier: [{ value: 'LOC-001' }],
      })
      expect(location.BreadcrumbLabel).toBe('LOC-001')
    })
  })

  describe('Practitioner', () => {
    it('uses formatted name', () => {
      const practitioner = decodePractitioner({
        name: [{ given: ['Jane'], family: 'Smith' }],
      })
      expect(practitioner.BreadcrumbLabel).toBe('Jane Smith')
    })

    it('falls back when name is missing', () => {
      const practitioner = decodePractitioner({})
      expect(practitioner.BreadcrumbLabel).toBe('Unnamed Practitioner')
    })
  })

  describe('Observation', () => {
    it('uses code text', () => {
      const observation = decodeObservation({
        status: 'final',
        code: { text: 'Blood Pressure' },
      })
      expect(observation.BreadcrumbLabel).toBe('Blood Pressure')
    })

    it('uses coding display when text is missing', () => {
      const observation = decodeObservation({
        status: 'final',
        code: { coding: [{ display: 'Heart Rate' }] },
      })
      expect(observation.BreadcrumbLabel).toBe('Heart Rate')
    })

    it('falls back when code has no display', () => {
      const observation = decodeObservation({
        status: 'final',
        code: {},
      })
      expect(observation.BreadcrumbLabel).toBe('Unknown Observation')
    })
  })

  describe('Composition', () => {
    it('uses title', () => {
      const composition = decodeComposition({
        status: 'final',
        type: {},
        date: '2024-01-01',
        author: [],
        title: 'Progress Note',
      })
      expect(composition.BreadcrumbLabel).toBe('Progress Note')
    })

    it('uses type text when title is empty', () => {
      const composition = decodeComposition({
        status: 'final',
        type: { text: 'Discharge Summary' },
        date: '2024-01-01',
        author: [],
        title: '',
      })
      expect(composition.BreadcrumbLabel).toBe('Discharge Summary')
    })

    it('falls back when both are empty', () => {
      const composition = decodeComposition({
        status: 'final',
        type: {},
        date: '2024-01-01',
        author: [],
        title: '',
      })
      expect(composition.BreadcrumbLabel).toBe('Untitled Composition')
    })
  })

  describe('class-level (collection label)', () => {
    it('Patient', () => {
      expect(Patient.BreadcrumbLabel).toBe('Patients')
    })

    it('Practitioner', () => {
      expect(Practitioner.BreadcrumbLabel).toBe('Practitioners')
    })

    it('Location', () => {
      expect(Location.BreadcrumbLabel).toBe('Locations')
    })

    it('Observation', () => {
      expect(Observation.BreadcrumbLabel).toBe('Observations')
    })

    it('Composition', () => {
      expect(Composition.BreadcrumbLabel).toBe('Compositions')
    })

    it('Encounter', () => {
      expect(Encounter.BreadcrumbLabel).toBe('Encounters')
    })
  })

  describe('assertBreadcrumbLabel', () => {
    it('succeeds for resources with trait', () => {
      const patient = decodePatient({})
      expect(() => assertBreadcrumbLabel(patient)).not.toThrow()
    })

    it('throws for plain objects', () => {
      expect(() => assertBreadcrumbLabel({})).toThrow(
        'Resource missing BreadcrumbLabel trait'
      )
    })

    it('throws for null', () => {
      expect(() => assertBreadcrumbLabel(null)).toThrow(
        'Resource missing BreadcrumbLabel trait'
      )
    })
  })
})
