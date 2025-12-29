import { Effect } from 'effect'
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
import {
  ObservationFormData,
  transformToObservation,
} from '../schemas/ObservationFormSchema'
import { WithId } from '@assessmentis/clinical-domain/data-types'

export const updateObservation = (
  id: ObservationId,
  currentObservation: Observation,
  formData: ObservationFormData
): Effect.Effect<
  Observation,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  ObservationRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* ObservationRepository

    // Merge form data with existing observation
    const updatedObservation: WithId<Observation> = {
      ...currentObservation,
      ...transformToObservation(formData),
      id,
    }

    return yield* repository.update(updatedObservation)
  })
}
