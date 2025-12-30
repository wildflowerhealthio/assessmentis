import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import {
  transformToPatient,
  PatientFormData,
} from '../schemas/PatientFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updatePatient = createResourceUpdateAction<
  PatientFormData,
  Patient,
  PatientId,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  typeof PatientRepository,
  ClientRuntimeContext
>(PatientRepository, transformToPatient)
