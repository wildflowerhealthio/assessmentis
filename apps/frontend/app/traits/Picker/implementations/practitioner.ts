import * as ClinicalDomain from '@assessmentis/clinical-domain'

// eslint-disable-next-line import/no-unassigned-import -- Registers the Labeled trait that Picker depends on
import '../../Labeled/implementations/practitioner'

import { formatHumanName } from '../../../modules/common/utils/fhir-display'
import { applyPickerStatics } from '../apply-picker-statics'
import type { PickerItemInstance, PickerItemProps } from '../picker-item'

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
  configurable: true,
  get(this: ClinicalDomain.Practitioner): PickerItemProps {
    const qualification = this.qualification?.[0]?.code?.text
    return {
      id: this.url?.toString() ?? '',
      display: formatHumanName(this.name?.[0], 'Unnamed Practitioner'),
      secondary: qualification ?? 'No qualification listed',
    }
  },
})
