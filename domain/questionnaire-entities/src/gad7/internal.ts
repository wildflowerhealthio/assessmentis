import {
  Code,
  type CodeableConcept,
} from '@assessmentis/clinical-domain/data-types'
import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { literalOf } from '@assessmentis/util'

const surveyCategory = {
  coding: [
    {
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
      code: literalOf(Code)('survey'),
      display: 'Survey',
    },
  ],
} as const satisfies CodeableConcept

export const baseChoiceObservation = {
  resourceType: 'Observation',
  category: [surveyCategory],
} as const satisfies Pick<Observation, 'resourceType' | 'category'>

export type ObservationTemplate = Omit<Observation, 'id' | 'meta' | 'status'>
