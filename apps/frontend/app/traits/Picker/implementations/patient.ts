import * as ClinicalDomain from '@assessmentis/clinical-domain'
import { runEffectSync } from '@/run-effect-sync'

import '../../Labeled/implementations/patient'

import { humanizeTimelessDate } from '../../../modules/common/utils/date-utils'
import { formatGender, formatHumanName } from '../../../modules/common/utils/fhir-display'
import { applyPickerStatics } from '../apply-picker-statics'
import type { PickerItemInstance, PickerItemProps } from '../picker-item'

declare module '@assessmentis/clinical-domain' {
  interface Patient extends PickerItemInstance {
    readonly PickerItem: PickerItemProps
  }

  namespace Patient {
    export const PickerItem: {
      Placeholder: string
      Label: string
    }
  }
}
applyPickerStatics(ClinicalDomain.Patient)
Object.defineProperty(ClinicalDomain.Patient.prototype, 'PickerItem', {
  configurable: true,
  get(this: ClinicalDomain.Patient): PickerItemProps {
    return {
      id: this.url?.toString() ?? '',
      display: formatHumanName(this.name?.[0], 'Unnamed Patient'),
      secondary: `${formatGender(this.gender)} • Born: ${runEffectSync(humanizeTimelessDate(this.birthDate))}`,
    }
  },
})
