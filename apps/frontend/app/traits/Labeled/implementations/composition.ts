import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyLabeled } from '../apply-labeled'
import type { LabeledProps } from '../labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Composition {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Composition, 'Composition', 'Compositions')
