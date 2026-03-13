import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface Location extends LinkInstance {
    readonly Link: string
  }
  namespace Location {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Location)
