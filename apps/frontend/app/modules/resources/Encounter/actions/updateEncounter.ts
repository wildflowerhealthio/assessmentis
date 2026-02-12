import { DateTime, Effect } from 'effect'
import type {
  Encounter,
  EncounterId,
} from '@assessmentis/clinical-domain/administration'
import { EncounterRepository } from '@assessmentis/clinical-domain/administration'
import type {
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { WithId } from '@assessmentis/clinical-domain/data-types'
import type { EncounterFormData } from '../schemas/EncounterFormSchema'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

export const updateEncounter = (
  id: EncounterId,
  currentEncounter: Encounter,
  formData: EncounterFormData
): Effect.Effect<
  Encounter,
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { id: EncounterId }>,
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
              start: formData.periodStart?.pipe(DateTime.toUtc),
              end: formData.periodEnd?.pipe(DateTime.toUtc),
            }
          : undefined,
      // Update location references (preserve virtual/video room locations)
      location: [
        // Keep existing virtual location entries (video room)
        ...(currentEncounter.location?.filter((l) =>
          l.physicalType?.coding?.some((c) => c.code === 'vi')
        ) ?? []),
        // Add user-selected physical location if provided
        ...(formData.locationId
          ? [
              {
                location: {
                  reference: `Location/${formData.locationId}`,
                },
              },
            ]
          : []),
      ],
    }

    return yield* repository.update(updatedEncounter)
  })
}
