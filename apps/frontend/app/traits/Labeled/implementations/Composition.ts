import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Composition {
    export const Labeled: LabeledProps
  }
}
Object.defineProperty(ClinicalDomain.Composition, 'Labeled', {
  value: {
    singularLabel: 'Composition',
    pluralLabel: 'Compositions',
  } satisfies LabeledProps,
  configurable: true,
})
