import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const usePractitionerCollection =
  createResourceCollectionHook<Practitioner>({
    resourceType: 'Practitioner',
  })
