import { PractitionerRepository } from '@assessmentis/clinical-domain/administration'
import { transformToPractitioner } from '../schemas/PractitionerFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPractitioner = createResourceCreateAction(
  PractitionerRepository,
  transformToPractitioner
)
