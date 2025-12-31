import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  transformToPatient,
  PatientFormData,
} from '../schemas/PatientFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePatient = createResourceUpdateAction<
  PatientFormData,
  PatientId,
  Patient,
  PatientRepository['Id'],
  InstanceType<typeof PatientRepository>
>(PatientRepository, transformToPatient)
