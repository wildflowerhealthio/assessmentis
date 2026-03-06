import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends LinkInstance {
    readonly Link: string
  }
  namespace Observation {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Observation)
