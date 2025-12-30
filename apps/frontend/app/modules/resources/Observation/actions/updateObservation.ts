import { ObservationRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { transformToObservation } from '../schemas/ObservationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateObservation = createResourceUpdateAction(
  ObservationRepository,
  transformToObservation
)
