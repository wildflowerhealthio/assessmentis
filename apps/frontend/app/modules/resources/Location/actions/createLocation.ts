import { Location } from '@assessmentis/clinical-domain/administration'
import {
  LocationFormData,
  transformToLocation,
} from '../schemas/LocationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createLocation = createResourceCreateAction<
  LocationFormData,
  Location
>('Location', transformToLocation)
