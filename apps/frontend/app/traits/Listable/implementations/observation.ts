import { Effect } from 'effect'

import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  formatObservationValue,
  getObservationDisplayName,
  getObservationEffectiveDate,
  getObservationStatus,
} from '../../../modules/resources/Observation/utils/observation-display'
import { runEffectSync } from '../../../run-effect-sync'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Observation extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Observation.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.Observation): ListableProps {
    const { effectiveDate, value } = runEffectSync(
      Effect.gen(
        // oxlint-disable-next-line @typescript-eslint/explicit-function-return-type -- Effect.gen callback return type is inferred by the library
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
      summaryItems: [getObservationStatus(this), effectiveDate, `Value: ${value}`],
    }
  },
})
