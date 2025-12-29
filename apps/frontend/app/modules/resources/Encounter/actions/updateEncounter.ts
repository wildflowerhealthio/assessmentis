import { Effect } from 'effect'
import {
  Encounter,
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import { EncounterFormData } from '../schemas/EncounterFormSchema'

export const updateEncounter = (
  id: EncounterId,
  currentEncounter: Encounter,
  formData: EncounterFormData
): Effect.Effect<
  Encounter,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  EncounterRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* EncounterRepository

    // Build updated encounter with form data
    const updatedEncounter: WithId<Encounter> = {
      ...currentEncounter,
      id,
      // Update subject (patient)
      subject: formData.patientId
        ? { reference: `Patient/${formData.patientId}` }
        : undefined,
      // Update participant (practitioners)
      participant: formData.practitionerIds?.map((practitionerId) => ({
        individual: { reference: `Practitioner/${practitionerId}` },
      })),
      // Update period
      period:
        formData.periodStart || formData.periodEnd
          ? {
              start: formData.periodStart,
              end: formData.periodEnd,
            }
          : undefined,
      // Update location display (preserve video room location if it exists)
      location: formData.locationDisplay
        ? [
            // Keep existing video room location if it exists
            ...(currentEncounter.location ?? []),
            // Add/update the display location
            {
              location: {
                display: formData.locationDisplay,
              },
            },
          ]
        : currentEncounter.location,
    }

    return yield* repository.update(updatedEncounter)
  })
}
