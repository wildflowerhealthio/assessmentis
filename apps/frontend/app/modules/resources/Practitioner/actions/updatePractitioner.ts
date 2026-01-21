import { Practitioner } from '@assessmentis/clinical-domain/administration'
import {
  transformToPractitioner,
  PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePractitioner = createResourceUpdateAction<
  PractitionerFormData,
  Practitioner
>('Practitioner', transformToPractitioner)
