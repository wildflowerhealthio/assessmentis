import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import type { PractitionerFormData } from '../schemas/PractitionerFormSchema'
import { transformToPractitioner } from '../schemas/PractitionerFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePractitioner = createResourceUpdateAction<
  PractitionerFormData,
  Practitioner
>('Practitioner', transformToPractitioner)
