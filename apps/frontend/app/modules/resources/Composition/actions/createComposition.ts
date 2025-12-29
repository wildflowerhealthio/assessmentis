import { Effect } from 'effect'
import {
  Composition,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  CompositionFormData,
  transformToComposition,
} from '../schemas/CompositionFormSchema'

export const createComposition = (
  formData: CompositionFormData
): Effect.Effect<
  Composition,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  CompositionRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* CompositionRepository
    const composition = transformToComposition(formData)
    return yield* repository.create(composition)
  })
}
