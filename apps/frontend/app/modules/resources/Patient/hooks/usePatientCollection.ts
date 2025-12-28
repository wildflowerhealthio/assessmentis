import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { ContextError, useRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'

export const usePatientCollection = (filters: object) => {
  const patients = useRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const patientRepository = yield* PatientRepository
        return yield* patientRepository.getMany(filters)
      })
    }, [filters])
  )
  return useClinicalDataCollection<
    PatientId,
    Patient,
    PatientRepository,
    typeof PatientRepository,
    | UnhandledError
    | NeedsAuthenticationError
    | ExternalAssertionError
    | null
    | ContextError
  >(PatientRepository, patients)
}
