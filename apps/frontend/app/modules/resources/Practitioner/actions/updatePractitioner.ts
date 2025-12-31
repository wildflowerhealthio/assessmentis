import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  transformToPractitioner,
  PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePractitioner = createResourceUpdateAction<
  PractitionerFormData,
  PractitionerId,
  Practitioner,
  PractitionerRepository['Id'],
  InstanceType<typeof PractitionerRepository>
>(PractitionerRepository, transformToPractitioner)
