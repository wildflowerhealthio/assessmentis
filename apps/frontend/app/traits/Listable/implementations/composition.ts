import * as ClinicalDomain from '@assessmentis/clinical-domain'

import {
  getCompositionDisplayName,
  getCompositionType,
} from '../../../modules/resources/Composition/utils/composition-display'
import type { ListableInstance, ListableProps } from '../listable'

declare module '@assessmentis/clinical-domain' {
  interface Composition extends ListableInstance {
    readonly Listable: ListableProps
  }
}
Object.defineProperty(ClinicalDomain.Composition.prototype, 'Listable', {
  configurable: true,
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
})
