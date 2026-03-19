import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyLabeled } from '../apply-labeled'
import type { LabeledProps } from '../labeled'

declare module '@assessmentis/clinical-domain' {
  namespace Location {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Location, 'Location', 'Locations')
