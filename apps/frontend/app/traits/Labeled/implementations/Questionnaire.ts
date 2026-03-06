import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Questionnaire {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Questionnaire, 'Labeled', {
  value: {
    singularLabel: 'Questionnaire',
    pluralLabel: 'Questionnaires',
  } satisfies LabeledProps,
  configurable: true,
})
