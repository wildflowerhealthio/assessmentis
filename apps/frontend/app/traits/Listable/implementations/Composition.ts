import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  getCompositionDisplayName,
  getCompositionType,
} from '../../../modules/resources/Composition/utils/compositionDisplay'
import type { ListableInstance, ListableProps } from '../Listable'

declare module '@assessmentis/clinical-domain' {
  interface Composition extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Composition.prototype, 'Listable', {
  get(this: ClinicalDomain.Composition): ListableProps {
    return {
      displayName: getCompositionDisplayName(this),
      summaryItems: [
        getCompositionType(this),
        this.status,
        new Date(this.date.epochMillis).toLocaleDateString(),
      ],
    }
  },
  configurable: true,
})
