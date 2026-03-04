import type { Location } from '@assessmentis/clinical-domain'

import { createResourcePicker } from '../../../common/utils/createResourcePicker'
import { getLocationDisplayName } from '../utils/locationDisplay'

export const LocationPicker = createResourcePicker({
  resourceType: 'Location',
  formatDisplay: (location: Location) => getLocationDisplayName(location),
  formatSecondary: (location: Location) =>
    location.description ?? location.status ?? '',
  defaultPlaceholder: 'Select a location...',
  defaultLabel: 'Location',
})
