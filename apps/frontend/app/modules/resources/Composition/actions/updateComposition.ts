import { Effect } from 'effect'
import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  CompositionFormData,
  transformToComposition,
} from '../schemas/CompositionFormSchema'
import { WithId } from '../../../../../../../domain/clinical-domain/src/data-types/base'

export const updateComposition = (
  id: CompositionId,
  currentComposition: Composition,
  formData: CompositionFormData
): Effect.Effect<
  Composition,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  CompositionRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* CompositionRepository

    // Transform form data and merge with existing composition
    const updatedFields = transformToComposition(formData)
    const updatedComposition: WithId<Composition> = {
      ...currentComposition,
      ...updatedFields,
      id,
    }

    return yield* repository.update(updatedComposition)
  })
}
