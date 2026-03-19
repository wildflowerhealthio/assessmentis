import * as ClinicalDomain from '@assessmentis/clinical-domain'
import { Predicate } from 'effect'

import { getLocationDisplayName } from '../../../modules/resources/Location/utils/location-display'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Location extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Location.prototype, 'Listable', {
  configurable: true,
  get(this: ClinicalDomain.Location): ListableProps {
    return {
      displayName: getLocationDisplayName(this),
      summaryItems: [this.status, this.mode].filter((x) => Predicate.isNotNullable(x)),
    }
  },
})
