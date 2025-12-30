import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useObservationCollection = createResourceCollectionHook<
  ObservationRepository,
  ObservationId,
  Observation,
  typeof ObservationRepository
>({
  repository: ObservationRepository,
})
