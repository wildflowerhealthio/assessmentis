import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  transformToPatient,
  PatientFormData,
} from '../schemas/PatientFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPatient = createResourceCreateAction<
  PatientFormData,
  PatientId,
  Patient,
  PatientRepository['Id'],
  InstanceType<typeof PatientRepository>
>(PatientRepository, transformToPatient)
