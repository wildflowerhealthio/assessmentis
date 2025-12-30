import {
  Practitioner,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import {
  transformToPractitioner,
  PractitionerFormData,
} from '../schemas/PractitionerFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPractitioner = createResourceCreateAction<
  PractitionerFormData,
  Practitioner,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  typeof PractitionerRepository,
  ClientRuntimeContext
>(PractitionerRepository, transformToPractitioner)
