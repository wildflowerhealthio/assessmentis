import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Patient {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Patient, 'Labeled', {
  value: {
    singularLabel: 'Patient',
    pluralLabel: 'Patients',
  } satisfies LabeledProps,
  configurable: true,
})
