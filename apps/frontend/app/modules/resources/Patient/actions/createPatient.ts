import { PatientRepository } from '@assessmentis/clinical-domain/administration'
import { transformToPatient } from '../schemas/PatientFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPatient = createResourceCreateAction(
  PatientRepository,
  transformToPatient
)
