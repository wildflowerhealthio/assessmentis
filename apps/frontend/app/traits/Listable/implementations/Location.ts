import * as ClinicalDomain from '@assessmentis/clinical-domain'

import { getLocationDisplayName } from '../../../modules/resources/Location/utils/locationDisplay'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Location extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Location.prototype, 'Listable', {
  get(this: ClinicalDomain.Location): ListableProps {
    return {
      displayName: getLocationDisplayName(this),
      summaryItems: [this.status, this.mode].filter(
        (v): v is NonNullable<typeof v> => v != null
      ),
    }
  },
  configurable: true,
})
