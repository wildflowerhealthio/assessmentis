import type { Patient } from '@assessmentis/clinical-domain/administration'
import { createResourceCollectionHook } from '../../../common/utils/createResourceCollectionHook'

export const usePatientCollection = createResourceCollectionHook<Patient>({
  resourceType: 'Patient',
})
