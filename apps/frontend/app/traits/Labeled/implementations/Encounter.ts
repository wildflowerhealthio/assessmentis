import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Encounter {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Encounter, 'Labeled', {
  value: {
    singularLabel: 'Encounter',
    pluralLabel: 'Encounters',
  } satisfies LabeledProps,
  configurable: true,
})
