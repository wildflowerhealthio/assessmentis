import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Patient'

import { humanizeTimelessDate } from '../../../modules/common/utils/dateUtils'
import {
  formatGender,
  formatHumanName,
} from '../../../modules/common/utils/fhirDisplay'
import { applyPickerStatics } from '../applyPickerStatics'
import type { PickerItemInstance, PickerItemProps } from '../PickerItem'

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
  get(this: ClinicalDomain.Patient): PickerItemProps {
    return {
      id: this.url?.toString() ?? '',
      display: formatHumanName(this.name?.[0], 'Unnamed Patient'),
      secondary: `${formatGender(this.gender)} • Born: ${humanizeTimelessDate(this.birthDate)}`,
    }
  },
  configurable: true,
})
