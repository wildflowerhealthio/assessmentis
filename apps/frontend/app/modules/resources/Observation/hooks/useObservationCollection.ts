import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useObservationCollection =
  createResourceCollectionHook<Observation>({
    resourceType: 'Observation',
  })
