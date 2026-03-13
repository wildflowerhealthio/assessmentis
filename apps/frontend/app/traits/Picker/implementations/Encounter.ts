import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Encounter'

import { applyPickerStatics } from '../applyPickerStatics'
import type { PickerItemInstance, PickerItemProps } from '../PickerItem'

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
  get(this: ClinicalDomain.Encounter): PickerItemProps {
    const encounterClass =
      this.class?.display || this.class?.code || 'Unknown class'
    const status = this.status || 'unknown'
    return {
      id: this.url?.toString() ?? '',
      display: `Encounter ${this.url?.toString() || 'Unknown'}`,
      secondary: `${encounterClass} • Status: ${status}`,
    }
  },
  configurable: true,
})
