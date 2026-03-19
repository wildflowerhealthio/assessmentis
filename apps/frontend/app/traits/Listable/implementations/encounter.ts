import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  getEncounterDisplayName,
  getEncounterPeriodDisplay,
  getEncounterStatus,
} from '../../../modules/resources/Encounter/utils/encounter-display'
import { runEffectSyncFlat } from '../../../run-effect-sync'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Encounter.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.Encounter): ListableProps {
    const displayName = runEffectSyncFlat(getEncounterDisplayName(this))
    const status = getEncounterStatus(this)
    const periodDisplay = runEffectSyncFlat(getEncounterPeriodDisplay(this))

    return {
      displayName,
      summaryItems: [status, periodDisplay].filter((x) => Boolean(x)),
    }
  },
})
