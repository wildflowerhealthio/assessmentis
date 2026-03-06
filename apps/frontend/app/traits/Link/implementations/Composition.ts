import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface Composition extends LinkInstance {
    readonly Link: string
  }
  namespace Composition {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Composition)
