import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Practitioner'

import { formatHumanName } from '../../../modules/common/utils/fhirDisplay'
import { applyPickerStatics } from '../applyPickerStatics'
import type { PickerItemInstance, PickerItemProps } from '../PickerItem'

declare module '@assessmentis/clinical-domain' {
  interface Practitioner extends PickerItemInstance {
    readonly PickerItem: PickerItemProps
  }

  namespace Practitioner {
    export const PickerItem: {
      Placeholder: string
      Label: string
    }
  }
}
applyPickerStatics(ClinicalDomain.Practitioner, {
  Placeholder: 'Select practitioner(s)...',
})
Object.defineProperty(ClinicalDomain.Practitioner.prototype, 'PickerItem', {
  get(this: ClinicalDomain.Practitioner): PickerItemProps {
    const qualification = this.qualification?.[0]?.code?.text
    return {
      id: this.url?.toString() ?? '',
      display: formatHumanName(this.name?.[0], 'Unnamed Practitioner'),
      secondary: qualification || 'No qualification listed',
    }
  },
  configurable: true,
})
