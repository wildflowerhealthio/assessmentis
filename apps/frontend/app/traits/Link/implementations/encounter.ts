import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../apply-default-link-trait-implementation'
import type { LinkInstance } from '../link'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends LinkInstance {
    readonly Link: string
  }
  namespace Encounter {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.Encounter)
