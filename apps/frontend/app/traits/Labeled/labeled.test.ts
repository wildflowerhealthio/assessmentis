import { describe, expect, it } from 'vitest'

import {
  Composition,
  Encounter,
  Location,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Loads trait barrel to register implementations for testing
import '.'

describe('Labeled trait', () => {
  it.each([
    [Patient, 'Patient', 'Patients'],
    [Practitioner, 'Practitioner', 'Practitioners'],
    [Location, 'Location', 'Locations'],
    [Observation, 'Observation', 'Observations'],
    [Composition, 'Composition', 'Compositions'],
    [Encounter, 'Encounter', 'Encounters'],
    [Questionnaire, 'Questionnaire', 'Questionnaires'],
    [QuestionnaireResponse, 'Questionnaire Response', 'Questionnaire Responses'],
  ] as const)('%s has correct labels', (klass, expectedSingular, expectedPlural) => {
    expect(klass.Labeled.singularLabel).toBe(expectedSingular)
    expect(klass.Labeled.pluralLabel).toBe(expectedPlural)
  })
})
