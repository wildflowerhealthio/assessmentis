import {
  Patient,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { transformToPatient, PatientFormData } from '../schemas/PatientFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createPatient = createResourceCreateAction<
  PatientFormData,
  Patient,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  typeof PatientRepository,
  ClientRuntimeContext
>(PatientRepository, transformToPatient)
