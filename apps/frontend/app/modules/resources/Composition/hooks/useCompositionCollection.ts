import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { useResourceRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'

export const useCompositionCollection = (filters: object) => {
  const compositions = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const compositionRepository = yield* CompositionRepository
        return yield* compositionRepository.getMany(filters)
      })
    }, [filters])
  )
  return useClinicalDataCollection<
    CompositionId,
    Composition,
    CompositionRepository,
    typeof CompositionRepository,
    never
  >(CompositionRepository, compositions)
}
