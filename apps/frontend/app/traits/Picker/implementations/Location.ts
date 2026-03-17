import * as ClinicalDomain from '@assessmentis/clinical-domain'

import '../../Labeled/implementations/Location'

import { getLocationDisplayName } from '../../../modules/resources/Location/utils/locationDisplay'
import { applyPickerStatics } from '../applyPickerStatics'
import type { PickerItemInstance, PickerItemProps } from '../PickerItem'

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
  get(this: ClinicalDomain.Location): PickerItemProps {
    return {
      id: this.url?.toString() ?? '',
      display: getLocationDisplayName(this),
      secondary: this.description ?? this.status ?? '',
    }
  },
  configurable: true,
})
