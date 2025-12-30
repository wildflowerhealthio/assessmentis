import {
  Encounter,
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const useEncounterCollection = createResourceCollectionHook<
  EncounterRepository,
  EncounterId,
  Encounter,
  typeof EncounterRepository
>({
  repository: EncounterRepository,
})
