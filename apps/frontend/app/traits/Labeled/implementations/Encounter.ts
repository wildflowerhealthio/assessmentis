import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'
import { applyLabeled } from '../applyLabeled'

declare module '@assessmentis/clinical-domain' {
  namespace Encounter {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Encounter, 'Encounter', 'Encounters')
