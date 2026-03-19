import { describe, expect, test } from 'vitest'

import { Composition } from '../resources/Composition/composition'
import { DiagnosticReport } from '../resources/DiagnosticReport/diagnostic-report'
import { Encounter } from '../resources/Encounter/encounter'
import { Location } from '../resources/Location/location'
import { Media } from '../resources/Media/media'
import { Observation } from '../resources/Observation/observation'
import { Patient } from '../resources/Patient/patient'
import { Practitioner } from '../resources/Practitioner/practitioner'
import { Questionnaire } from '../resources/Questionnaire/questionnaire'
import { QuestionnaireResponse } from '../resources/QuestionnaireResponse/questionnaire-response'
import { Attachment } from './complex/attachment'
import { CodeableConcept } from './complex/codeable-concept'
import { Coding } from './complex/coding'
import { Identifier, Reference } from './complex/identifier-and-reference'
import { Period } from './complex/period'
import { Quantity } from './complex/quantity'
import { Range } from './complex/range'

describe('static DomainType and UrlSchema pass through on all classes', () => {
  describe('Resource classes', () => {
    test('Patient.DomainType is "Patient"', () => {
      expect(Patient.DomainType).toBe('Patient')
    })

    test('Patient.UrlSchema is defined', () => {
      expect(Patient.UrlSchema).toBeDefined()
    })

    test('Encounter.DomainType is "Encounter"', () => {
      expect(Encounter.DomainType).toBe('Encounter')
    })

    test('Encounter.UrlSchema is defined', () => {
      expect(Encounter.UrlSchema).toBeDefined()
    })

    test('Composition.DomainType is "Composition"', () => {
      expect(Composition.DomainType).toBe('Composition')
    })

    test('Composition.UrlSchema is defined', () => {
      expect(Composition.UrlSchema).toBeDefined()
    })

    test('Observation.DomainType is "Observation"', () => {
      expect(Observation.DomainType).toBe('Observation')
    })

    test('Observation.UrlSchema is defined', () => {
      expect(Observation.UrlSchema).toBeDefined()
    })

    test('DiagnosticReport.DomainType is "DiagnosticReport"', () => {
      expect(DiagnosticReport.DomainType).toBe('DiagnosticReport')
    })

    test('Practitioner.DomainType is "Practitioner"', () => {
      expect(Practitioner.DomainType).toBe('Practitioner')
    })

    test('Media.DomainType is "Media"', () => {
      expect(Media.DomainType).toBe('Media')
    })

    test('Location.DomainType is "Location"', () => {
      expect(Location.DomainType).toBe('Location')
    })

    test('Questionnaire.DomainType is "Questionnaire"', () => {
      expect(Questionnaire.DomainType).toBe('Questionnaire')
    })

    test('QuestionnaireResponse.DomainType is "QuestionnaireResponse"', () => {
      expect(QuestionnaireResponse.DomainType).toBe('QuestionnaireResponse')
    })
  })

  describe('Element-based classes', () => {
    test('Coding.DomainType is "Coding"', () => {
      expect(Coding.DomainType).toBe('Coding')
    })

    test('Coding.UrlSchema is defined', () => {
      expect(Coding.UrlSchema).toBeDefined()
    })

    test('CodeableConcept.DomainType is "CodeableConcept"', () => {
      expect(CodeableConcept.DomainType).toBe('CodeableConcept')
    })

    test('Period.DomainType is "Period"', () => {
      expect(Period.DomainType).toBe('Period')
    })

    test('Quantity.DomainType is "Quantity"', () => {
      expect(Quantity.DomainType).toBe('Quantity')
    })

    test('Range.DomainType is "Range"', () => {
      expect(Range.DomainType).toBe('Range')
    })

    test('Attachment.DomainType is "Attachment"', () => {
      expect(Attachment.DomainType).toBe('Attachment')
    })

    test('Reference.DomainType is "Reference"', () => {
      expect(Reference.DomainType).toBe('Reference')
    })

    test('Identifier.DomainType is "Identifier"', () => {
      expect(Identifier.DomainType).toBe('Identifier')
    })
  })
})
