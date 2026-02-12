import { Location } from '@assessmentis/clinical-domain/administration'
import {
  type LocationFormData,
  transformToLocation,
} from '../schemas/LocationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateLocation = createResourceUpdateAction<
  LocationFormData,
  Location
>('Location', transformToLocation)
