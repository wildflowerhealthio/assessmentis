import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends LinkInstance {
    readonly Link: string
  }
  namespace Patient {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Patient)
