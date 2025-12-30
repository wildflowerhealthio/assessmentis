import {
  Observation,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { transformToObservation, ObservationFormData } from '../schemas/ObservationFormSchema'
import { createResourceCreateAction } from '../../../common/actions/createResourceActions'

export const createObservation = createResourceCreateAction<
  ObservationFormData,
  Observation,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  typeof ObservationRepository,
  ClientRuntimeContext
>(ObservationRepository, transformToObservation)
