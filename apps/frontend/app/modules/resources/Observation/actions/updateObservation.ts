import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ObservationFormData,
  transformToObservation,
} from '../schemas/ObservationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateObservation = createResourceUpdateAction<
  ObservationFormData,
  Observation
>('Observation', transformToObservation)
