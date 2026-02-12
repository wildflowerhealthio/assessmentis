import type { Location } from '@assessmentis/clinical-domain/administration'
import { getLocationDisplayName } from '../utils/locationDisplay'
import { createResourcePicker } from '../../../common/utils/createResourcePicker'

export const LocationPicker = createResourcePicker({
  resourceType: 'Location',
  formatDisplay: (location: Location) => getLocationDisplayName(location),
  formatSecondary: (location: Location) =>
    location.description ?? location.status ?? '',
  defaultPlaceholder: 'Select a location...',
  defaultLabel: 'Location',
})
