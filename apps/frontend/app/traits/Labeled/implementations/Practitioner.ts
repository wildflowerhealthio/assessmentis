import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Practitioner {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Practitioner, 'Labeled', {
  value: {
    singularLabel: 'Practitioner',
    pluralLabel: 'Practitioners',
  } satisfies LabeledProps,
  configurable: true,
})
