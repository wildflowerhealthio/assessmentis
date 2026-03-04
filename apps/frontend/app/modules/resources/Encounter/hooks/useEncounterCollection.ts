import { Encounter } from '@assessmentis/clinical-domain'

import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useEncounterCollection = createResourceCollectionHook<Encounter>({
  resourceType: 'Encounter',
})
