import { Effect } from 'effect'
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
import {
  PractitionerFormData,
  transformToPractitioner,
} from '../schemas/PractitionerFormSchema'
import { WithId } from '@assessmentis/clinical-domain/data-types'

export const updatePractitioner = (
  id: PractitionerId,
  currentPractitioner: Practitioner,
  formData: PractitionerFormData
): Effect.Effect<
  Practitioner,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  PractitionerRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* PractitionerRepository

    // Transform form data and merge with existing practitioner
    const updatedFields = transformToPractitioner(formData)
    const updatedPractitioner: WithId<Practitioner> = {
      ...currentPractitioner,
      ...updatedFields,
      id,
    }

    return yield* repository.update(updatedPractitioner)
  })
}
