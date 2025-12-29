import { Effect } from 'effect'
import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { useResourceRunEffect } from 'app/clientRuntime'
import { useMemo } from 'react'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'

export const useObservationCollection = (filter: {
  subject?: string
  encounter?: string
}) => {
  const remoteObservations = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const observationRepository = yield* ObservationRepository
        const observations = yield* observationRepository.getMany(filter)
        return observations
      })
    }, [filter])
  )

  return useClinicalDataCollection<
    ObservationId,
    Observation,
    ObservationRepository,
    typeof ObservationRepository,
    never
  >(ObservationRepository, remoteObservations)
}
