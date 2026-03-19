import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/encounter'

import { applyPickerStatics } from '../apply-picker-statics'
import type { PickerItemInstance, PickerItemProps } from '../picker-item'

declare module '@assessmentis/clinical-domain' {
  interface Encounter extends PickerItemInstance {
    readonly PickerItem: PickerItemProps
  }

  namespace Encounter {
    export const PickerItem: {
      Placeholder: string
      Label: string
    }
  }
}
applyPickerStatics(ClinicalDomain.Encounter, {
  Placeholder: 'Select an encounter...',
})
Object.defineProperty(ClinicalDomain.Encounter.prototype, 'PickerItem', {
  configurable: true,
  get(this: ClinicalDomain.Encounter): PickerItemProps {
    const encounterClass = this.class?.display ?? this.class?.code ?? 'Unknown class'
    const status = this.status || 'unknown'
    return {
      id: this.url?.toString() ?? '',
      display: `Encounter ${this.url?.toString() ?? 'Unknown'}`,
      secondary: `${encounterClass} • Status: ${status}`,
    }
  },
})
