import type { Patient } from '@assessmentis/clinical-domain/administration'
import type { PatientFormData } from '../schemas/PatientFormSchema'
import { transformToPatient } from '../schemas/PatientFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPatient = createResourceCreateAction<
  PatientFormData,
  Patient
>('Patient', transformToPatient)
