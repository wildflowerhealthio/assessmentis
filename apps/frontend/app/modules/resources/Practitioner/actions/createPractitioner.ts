import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  transformToPractitioner,
  PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPractitioner = createResourceCreateAction<
  PractitionerFormData,
  PractitionerId,
  Practitioner,
  PractitionerRepository['Id'],
  InstanceType<typeof PractitionerRepository>
>(PractitionerRepository, transformToPractitioner)
