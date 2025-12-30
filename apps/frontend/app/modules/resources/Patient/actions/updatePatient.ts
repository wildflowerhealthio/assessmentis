import { PatientRepository } from '@assessmentis/clinical-domain/administration'
import { transformToPatient } from '../schemas/PatientFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePatient = createResourceUpdateAction(
  PatientRepository,
  transformToPatient
)
