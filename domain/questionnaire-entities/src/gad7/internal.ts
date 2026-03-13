import type { Observation } from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
} from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '@assessmentis/util'

const surveyCategory = CodeableConcept.make({
  coding: [
    Coding.make({
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
      code: literalOf(Code)('survey'),
      display: 'Survey',
    }),
  ],
})

export const baseChoiceObservation = {
  domainType: 'Observation',
  category: [surveyCategory],
} as const satisfies Pick<Observation, 'domainType' | 'category'>

export type ObservationTemplate = Omit<
  ConstructorParameters<typeof Observation>[0],
  'url' | 'meta' | 'status'
>
