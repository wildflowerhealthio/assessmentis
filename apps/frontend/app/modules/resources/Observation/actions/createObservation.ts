import { ObservationRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { transformToObservation } from '../schemas/ObservationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createObservation = createResourceCreateAction(
  ObservationRepository,
  transformToObservation
)
