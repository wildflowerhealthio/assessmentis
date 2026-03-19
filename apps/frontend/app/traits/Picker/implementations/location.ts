import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/location'

import { getLocationDisplayName } from '../../../modules/resources/Location/utils/location-display'
import { applyPickerStatics } from '../apply-picker-statics'
import type { PickerItemInstance, PickerItemProps } from '../picker-item'

declare module '@assessmentis/clinical-domain' {
  interface Location extends PickerItemInstance {
    readonly PickerItem: PickerItemProps
  }

  namespace Location {
    export const PickerItem: {
      Placeholder: string
      Label: string
    }
  }
}
applyPickerStatics(ClinicalDomain.Location)
Object.defineProperty(ClinicalDomain.Location.prototype, 'PickerItem', {
  configurable: true,
  get(this: ClinicalDomain.Location): PickerItemProps {
    return {
      id: this.url?.toString() ?? '',
      display: getLocationDisplayName(this),
      secondary: this.description ?? this.status ?? '',
    }
  },
})
