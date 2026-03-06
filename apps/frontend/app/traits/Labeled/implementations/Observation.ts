import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Observation {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Observation, 'Labeled', {
  value: {
    singularLabel: 'Observation',
    pluralLabel: 'Observations',
  } satisfies LabeledProps,
  configurable: true,
})
