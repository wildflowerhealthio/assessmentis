import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  getEncounterDisplayName,
  getEncounterPeriodDisplay,
  getEncounterStatus,
} from '../../../modules/resources/Encounter/utils/encounterDisplay'
import { runEffectSyncFlat } from '../../../runEffectSync'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Encounter.prototype, 'Listable', {
  get(this: ClinicalDomain.Encounter): ListableProps {
    const displayName = runEffectSyncFlat(getEncounterDisplayName(this))
    const status = getEncounterStatus(this)
    const periodDisplay = runEffectSyncFlat(getEncounterPeriodDisplay(this))

    return {
      displayName,
      summaryItems: [status, periodDisplay].filter(Boolean),
    }
  },
  configurable: true,
})
