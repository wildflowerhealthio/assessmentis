import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that BreadcrumbLabel depends on
import '../../Labeled/implementations/encounter'

import { getEncounterDisplayName } from '../../../modules/resources/Encounter/utils/encounter-display'
import { runEffectSyncFlat } from '../../../run-effect-sync'
import type { BreadcrumbLabelInstance } from '../breadcrumb-label'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends BreadcrumbLabelInstance {
    readonly BreadcrumbLabel: string
  }
  namespace Encounter {
    export const BreadcrumbLabel: string
  }
}

Object.defineProperty(ClinicalDomain.Encounter, 'BreadcrumbLabel', {
  configurable: true,
  value: ClinicalDomain.Encounter.Labeled.pluralLabel,
})

Object.defineProperty(ClinicalDomain.Encounter.prototype, 'BreadcrumbLabel', {
  configurable: true,
  get(this: ClinicalDomain.Encounter): string {
    return runEffectSyncFlat(getEncounterDisplayName(this))
  },
})
