import { Effect } from 'effect'
import {
  Patient,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  PatientFormData,
  transformToPatient,
} from '../schemas/PatientFormSchema'

export const createPatient = (
  formData: PatientFormData
): Effect.Effect<
  Patient,
  UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
  PatientRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* PatientRepository
    const patient = transformToPatient(formData)
    return yield* repository.create(patient)
  })
}
