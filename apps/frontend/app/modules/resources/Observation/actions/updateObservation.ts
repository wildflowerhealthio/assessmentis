import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import type { ObservationFormData } from '../schemas/ObservationFormSchema'
import { transformToObservation } from '../schemas/ObservationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateObservation = createResourceUpdateAction<
  ObservationFormData,
  Observation
>('Observation', transformToObservation)
