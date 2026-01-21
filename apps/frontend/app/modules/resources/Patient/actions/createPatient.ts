import { Patient } from '@assessmentis/clinical-domain/administration'
import {
  transformToPatient,
  PatientFormData,
} from '../schemas/PatientFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPatient = createResourceCreateAction<
  PatientFormData,
  Patient
>('Patient', transformToPatient)
