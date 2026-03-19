import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../apply-default-link-trait-implementation'
import type { LinkInstance } from '../link'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends LinkInstance {
    readonly Link: string
  }
  namespace Patient {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Patient)
