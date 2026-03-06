import { Effect } from 'effect'

import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  formatObservationValue,
  getObservationDisplayName,
  getObservationEffectiveDate,
  getObservationStatus,
} from '../../../modules/resources/Observation/utils/observationDisplay'
import { runEffectSyncFlat } from '../../../runEffectSync'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Observation.prototype, 'Listable', {
  get(this: ClinicalDomain.Observation): ListableProps {
    const { effectiveDate, value } = runEffectSyncFlat(
      Effect.gen(
        function* (this: ClinicalDomain.Observation) {
          return {
            effectiveDate: yield* getObservationEffectiveDate(this),
            value: yield* formatObservationValue(this),
          }
        }.bind(this)
      )
    ) as { effectiveDate: string; value: string }

    return {
      displayName: getObservationDisplayName(this),
      summaryItems: [
        getObservationStatus(this),
        effectiveDate,
        `Value: ${value}`,
      ],
    }
  },
  configurable: true,
})
