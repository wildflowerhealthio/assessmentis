import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  transformToObservation,
  ObservationFormData,
} from '../schemas/ObservationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createObservation = createResourceCreateAction<
  ObservationFormData,
  Observation
>('Observation', transformToObservation)
