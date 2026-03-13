import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends LinkInstance {
    readonly Link: string
  }
  namespace Practitioner {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Practitioner)
