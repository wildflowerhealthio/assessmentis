import { Encounter } from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useEncounterCollection = createResourceCollectionHook<Encounter>({
  resourceType: 'Encounter',
})
