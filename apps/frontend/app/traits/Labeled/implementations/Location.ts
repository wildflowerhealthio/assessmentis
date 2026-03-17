import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'
import { applyLabeled } from '../applyLabeled'

declare module '@assessmentis/clinical-domain' {
  namespace Location {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Location, 'Location', 'Locations')
