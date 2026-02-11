import type { Patient } from '@assessmentis/clinical-domain/administration'
import type { PatientFormData } from '../schemas/PatientFormSchema'
import { transformToPatient } from '../schemas/PatientFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePatient = createResourceUpdateAction<
  PatientFormData,
  Patient
>('Patient', transformToPatient)
