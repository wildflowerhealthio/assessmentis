import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Location {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Location, 'Labeled', {
  value: {
    singularLabel: 'Location',
    pluralLabel: 'Locations',
  } satisfies LabeledProps,
  configurable: true,
})
