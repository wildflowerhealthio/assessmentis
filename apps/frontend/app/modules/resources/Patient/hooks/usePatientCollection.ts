import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const usePatientCollection = createResourceCollectionHook<
  PatientRepository,
  PatientId,
  Patient,
  typeof PatientRepository
>({
  repository: PatientRepository,
})
