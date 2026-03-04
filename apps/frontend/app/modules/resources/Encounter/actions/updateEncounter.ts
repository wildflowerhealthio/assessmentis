import { DateTime, Effect } from 'effect'

import {
  EncounterLocation,
  EncounterParticipant,
  isVirtualLocation,
  type Encounter,
} from '@assessmentis/clinical-domain'
import { Period, Reference } from '@assessmentis/clinical-domain/data-types'
import { EncounterRepository } from '@assessmentis/clinical-domain/repositories'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { EncounterFormData } from '../schemas/EncounterFormSchema'

export const updateEncounter = (
  currentEncounter: Resource.WithResourceUrl<Encounter>,
  formData: EncounterFormData
): Effect.Effect<
  Encounter,
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { url: ReadonlyUrl }>,
  EncounterRepository
> => {
  return Effect.gen(function* () {
    const repository = yield* EncounterRepository

    // Build updated encounter with form data
    const updatedEncounter: Resource.WithResourceUrl<Encounter> = {
      ...currentEncounter,
      // Update subject (patient)
      subject: formData.patientUrl
        ? Reference.make({
            reference: formData.patientUrl.toString(),
            type: 'Patient',
          })
        : undefined,
      // Update participant (practitioners)
      participant: formData.practitionerUrls?.map((practitionerUrl) =>
        EncounterParticipant.make({
          individual: Reference.make({
            reference: practitionerUrl.toString(),
            type: 'Practitioner',
          }),
        })
      ),
      // Update period
      period:
        formData.periodStart || formData.periodEnd
          ? Period.make({
              start: formData.periodStart?.pipe(DateTime.toUtc),
              end: formData.periodEnd?.pipe(DateTime.toUtc),
            })
          : undefined,
      // Update location references (preserve virtual/video room locations)
      location: [
        // Keep existing virtual location entries (video room)
        ...(currentEncounter.location?.filter((l) => isVirtualLocation(l)) ??
          []),
        // Add user-selected physical location if provided
        ...(formData.locationUrl
          ? [
              EncounterLocation.make({
                location: Reference.make({
                  reference: formData.locationUrl.toString(),
                  type: 'Location',
                }),
              }),
            ]
          : []),
      ],
    }

    return yield* repository.update(updatedEncounter)
  })
}
