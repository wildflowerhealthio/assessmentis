import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { useClinicalDataCollection } from 'app/modules/common/hooks/useClinicalDataCollection'
import { useResourceRunEffect } from '../../../../clientRuntime'
import { useMemo } from 'react'
import { Effect } from 'effect'

export const usePatientCollection = (filters: object) => {
  const patients = useResourceRunEffect(
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
    never
  >(PatientRepository, patients)
}
