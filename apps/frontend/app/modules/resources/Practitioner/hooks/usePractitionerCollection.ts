import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { useResourceRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'

export const usePractitionerCollection = (filters: object) => {
  const practitioners = useResourceRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const practitionerRepository = yield* PractitionerRepository
        return yield* practitionerRepository.getMany(filters)
      })
    }, [filters])
  )
  return useClinicalDataCollection<
    PractitionerId,
    Practitioner,
    PractitionerRepository,
    typeof PractitionerRepository,
    never
  >(PractitionerRepository, practitioners)
}
