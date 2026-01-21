import { Practitioner } from '@assessmentis/clinical-domain/administration'
import {
  transformToPractitioner,
  PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPractitioner = createResourceCreateAction<
  PractitionerFormData,
  Practitioner
>('Practitioner', transformToPractitioner)
