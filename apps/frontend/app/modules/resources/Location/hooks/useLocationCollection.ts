import { Location } from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useLocationCollection = createResourceCollectionHook<Location>({
  resourceType: 'Location',
})
