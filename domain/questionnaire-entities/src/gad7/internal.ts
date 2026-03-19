import type { Observation } from '@assessmentis/clinical-domain'
import { Code, CodeableConcept, Coding } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'

const surveyCategory = CodeableConcept.make({
  coding: [
    Coding.make({
      code: literalOf(Code)('survey'),
      display: 'Survey',
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
    }),
  ],
})

export const baseChoiceObservation = {
  category: [surveyCategory],
  domainType: 'Observation',
} as const satisfies Pick<Observation, 'domainType' | 'category'>

export type ObservationInput = ConstructorParameters<typeof Observation>[0]

export type ObservationTemplate = Omit<ObservationInput, 'url' | 'meta' | 'status'>
