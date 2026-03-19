import { runEffectSync } from '@/run-effect-sync'

import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/questionnaire'

import { humanizeDateTimeForLocalReader } from '../../../modules/common/utils/date-utils'
import { applyPickerStatics } from '../apply-picker-statics'
import type { PickerItemInstance, PickerItemProps } from '../picker-item'

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
  configurable: true,
  get(this: ClinicalDomain.Questionnaire): PickerItemProps {
    const lastUpdatedValue = this.meta?.lastUpdated
    let lastUpdated: string = 'Unknown'
    if (typeof lastUpdatedValue === 'object' && lastUpdatedValue !== null) {
      lastUpdated = runEffectSync(humanizeDateTimeForLocalReader(lastUpdatedValue))
    } else if (typeof lastUpdatedValue === 'string') {
      lastUpdated = lastUpdatedValue
    }
    return {
      id: this.url?.toString() ?? '',
      display: this.title ?? 'Untitled Questionnaire',
      secondary: `Last updated: ${lastUpdated}`,
    }
  },
})
