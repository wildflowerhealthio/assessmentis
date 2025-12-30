import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import {
  transformToObservation,
  ObservationFormData,
} from '../schemas/ObservationFormSchema'
import { createResourceUpdateAction } from '../../../common/actions/createResourceActions'

export const updateObservation = createResourceUpdateAction<
  ObservationFormData,
  Observation,
  ObservationId,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  typeof ObservationRepository,
  ClientRuntimeContext
>(ObservationRepository, transformToObservation)
