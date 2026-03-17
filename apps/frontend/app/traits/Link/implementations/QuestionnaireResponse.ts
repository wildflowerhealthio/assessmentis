import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { applyDefaultLinkTraitImplementation } from '../applyDefaultLinkTraitImplementation'
import type { LinkInstance } from '../Link'

declare module '@assessmentis/clinical-domain' {
  interface QuestionnaireResponse extends LinkInstance {
    readonly Link: string
  }
  namespace QuestionnaireResponse {
    export const Link: string
  }
}

applyDefaultLinkTraitImplementation(ClinicalDomain.QuestionnaireResponse)
