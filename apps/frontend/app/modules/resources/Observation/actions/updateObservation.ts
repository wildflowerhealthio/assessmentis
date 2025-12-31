import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ObservationFormData,
  transformToObservation,
} from '../schemas/ObservationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateObservation = createResourceUpdateAction<
  ObservationFormData,
  ObservationId,
  Observation,
  ObservationRepository['Id'],
  InstanceType<typeof ObservationRepository>
>(ObservationRepository, transformToObservation)
