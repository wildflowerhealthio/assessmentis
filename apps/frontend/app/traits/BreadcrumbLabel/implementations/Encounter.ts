import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { getEncounterDisplayName } from '../../../modules/resources/Encounter/utils/encounterDisplay'
import { runEffectSyncFlat } from '../../../runEffectSync'
import type { BreadcrumbLabelInstance } from '../BreadcrumbLabel'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Encounter {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Encounter, 'BreadcrumbLabel', {
  value: 'Encounters',
  configurable: true,
})

Object.defineProperty(ClinicalDomain.Encounter.prototype, 'BreadcrumbLabel', {
  get(this: ClinicalDomain.Encounter): string {
    return runEffectSyncFlat(getEncounterDisplayName(this))
  },
  configurable: true,
})
