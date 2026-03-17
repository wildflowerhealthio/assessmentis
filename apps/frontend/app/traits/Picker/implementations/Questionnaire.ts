import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Questionnaire'

import { humanizeDateTimeForLocalReader } from '../../../modules/common/utils/dateUtils'
import { applyPickerStatics } from '../applyPickerStatics'
import type { PickerItemInstance, PickerItemProps } from '../PickerItem'

declare module '@assessmentis/clinical-domain' {
  interface Questionnaire extends PickerItemInstance {
    readonly PickerItem: PickerItemProps
  }

  namespace Questionnaire {
    export const PickerItem: {
      Placeholder: string
      Label: string
    }
  }
}
applyPickerStatics(ClinicalDomain.Questionnaire, {
  Placeholder: 'Select questionnaire(s)...',
})
Object.defineProperty(ClinicalDomain.Questionnaire.prototype, 'PickerItem', {
  get(this: ClinicalDomain.Questionnaire): PickerItemProps {
    const lastUpdatedValue = this.meta?.lastUpdated
    const lastUpdated =
      typeof lastUpdatedValue === 'object' && lastUpdatedValue !== null
        ? humanizeDateTimeForLocalReader(lastUpdatedValue)
        : typeof lastUpdatedValue === 'string'
          ? lastUpdatedValue
          : 'Unknown'
    return {
      id: this.url?.toString() ?? '',
      display: this.title || 'Untitled Questionnaire',
      secondary: `Last updated: ${lastUpdated}`,
    }
  },
  configurable: true,
})
