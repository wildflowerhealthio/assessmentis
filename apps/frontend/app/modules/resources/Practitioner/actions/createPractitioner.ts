import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import type { PractitionerFormData } from '../schemas/PractitionerFormSchema'
import { transformToPractitioner } from '../schemas/PractitionerFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPractitioner = createResourceCreateAction<
  PractitionerFormData,
  Practitioner
>('Practitioner', transformToPractitioner)
