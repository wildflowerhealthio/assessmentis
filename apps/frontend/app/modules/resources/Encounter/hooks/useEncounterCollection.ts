import {
  Encounter,
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { useResourceRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'

export const useEncounterCollection = (filters: object) => {
  const encounters = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const encounterRepository = yield* EncounterRepository
        return yield* encounterRepository.getMany(filters)
      })
    }, [filters])
  )
  return useClinicalDataCollection<
    EncounterId,
    Encounter,
    EncounterRepository,
    typeof EncounterRepository,
    never
  >(EncounterRepository, encounters)
}
