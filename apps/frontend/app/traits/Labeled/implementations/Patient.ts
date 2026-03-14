import * as ClinicalDomain from '@assessmentis/clinical-domain'

import type { LabeledProps } from '../Labeled'
import { applyLabeled } from '../applyLabeled'

declare module '@assessmentis/clinical-domain' {
  namespace Patient {
    export const Labeled: LabeledProps
  }
}
applyLabeled(ClinicalDomain.Patient, 'Patient', 'Patients')
