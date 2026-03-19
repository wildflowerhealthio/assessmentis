import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyLabeled } from '../apply-labeled'
import type { LabeledProps } from '../labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Practitioner {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Practitioner, 'Practitioner', 'Practitioners')
