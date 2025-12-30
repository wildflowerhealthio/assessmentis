import { PractitionerRepository } from '@assessmentis/clinical-domain/administration'
import { transformToPractitioner } from '../schemas/PractitionerFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePractitioner = createResourceUpdateAction(
  PractitionerRepository,
  transformToPractitioner
)
