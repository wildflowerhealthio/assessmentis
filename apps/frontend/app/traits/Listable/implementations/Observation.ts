import { Effect } from 'effect'

import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  formatObservationValue,
  getObservationDisplayName,
  getObservationEffectiveDate,
  getObservationStatus,
} from '../../../modules/resources/Observation/utils/observationDisplay'
import { runEffectSync } from '../../../runEffectSync'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Observation.prototype, 'Listable', {
  get(this: ClinicalDomain.Observation): ListableProps {
    const { effectiveDate, value } = runEffectSync(
      Effect.gen(
        function* (this: ClinicalDomain.Observation) {
          return {
            effectiveDate: yield* getObservationEffectiveDate(this),
            value: yield* formatObservationValue(this),
          }
        }.bind(this)
      )
    )

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
