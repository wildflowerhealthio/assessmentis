import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { transformToPractitioner, PractitionerFormData } from '../schemas/PractitionerFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePractitioner = createResourceUpdateAction<
  PractitionerFormData,
  Practitioner,
  PractitionerId,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError | NotFoundError,
  typeof PractitionerRepository,
  ClientRuntimeContext
>(PractitionerRepository, transformToPractitioner)
