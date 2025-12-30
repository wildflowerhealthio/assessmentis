import { ObservationRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useObservationCollection = createResourceCollectionHook({
  repository: ObservationRepository,
})
