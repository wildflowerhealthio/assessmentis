import { Patient } from '@assessmentis/clinical-domain/administration'
import {
  transformToPatient,
  PatientFormData,
} from '../schemas/PatientFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePatient = createResourceUpdateAction<
  PatientFormData,
  Patient
>('Patient', transformToPatient)
