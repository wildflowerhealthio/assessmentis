import { Effect } from 'effect'
import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import {
  PatientFormData,
  transformToPatient,
} from '../schemas/PatientFormSchema'
import { WithId } from '../../../../../../../domain/clinical-domain/src/data-types/base'

export const updatePatient = (
  id: PatientId,
  currentPatient: Patient,
  formData: PatientFormData
): Effect.Effect<
  Patient,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  PatientRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* PatientRepository

    // Transform form data and merge with existing patient
    const updatedFields = transformToPatient(formData)
    const updatedPatient: WithId<Patient> = {
      ...currentPatient,
      ...updatedFields,
      id,
    }

    return yield* repository.update(updatedPatient)
  })
}
