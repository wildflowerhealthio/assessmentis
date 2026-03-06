import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace QuestionnaireResponse {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.QuestionnaireResponse, 'Labeled', {
  value: {
    singularLabel: 'Questionnaire Response',
    pluralLabel: 'Questionnaire Responses',
  } satisfies LabeledProps,
  configurable: true,
})
