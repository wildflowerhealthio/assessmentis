import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import type { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { literalOf } from '../../../../global/util/src/addLiteralSupportToBrandedSchema'

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
