import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import type { ObservationFormData } from '../schemas/ObservationFormSchema'
import { transformToObservation } from '../schemas/ObservationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createObservation = createResourceCreateAction<
  ObservationFormData,
  Observation
>('Observation', transformToObservation)
