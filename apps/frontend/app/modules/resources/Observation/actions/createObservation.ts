import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  transformToObservation,
  ObservationFormData,
} from '../schemas/ObservationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createObservation = createResourceCreateAction<
  ObservationFormData,
  ObservationId,
  Observation,
  ObservationRepository['Id'],
  InstanceType<typeof ObservationRepository>
>(ObservationRepository, transformToObservation)
