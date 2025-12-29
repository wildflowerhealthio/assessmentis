import { Effect } from 'effect'
import {
  Observation,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  ObservationFormData,
  transformToObservation,
} from '../schemas/ObservationFormSchema'

export const createObservation = (
  formData: ObservationFormData
): Effect.Effect<
  Observation,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  ObservationRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* ObservationRepository
    const observation = transformToObservation(formData)
    return yield* repository.create(observation)
  })
}
