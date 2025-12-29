import { Effect } from 'effect'
import {
  Practitioner,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  PractitionerFormData,
  transformToPractitioner,
} from '../schemas/PractitionerFormSchema'

export const createPractitioner = (
  formData: PractitionerFormData
): Effect.Effect<
  Practitioner,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  PractitionerRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* PractitionerRepository
    const practitioner = transformToPractitioner(formData)
    return yield* repository.create(practitioner)
  })
}
