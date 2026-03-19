import { DateTime, Effect } from 'effect'

import {
  ClinicalDomainHub,
  Encounter,
  EncounterLocation,
  EncounterParticipant,
  isVirtualLocation,
} from '@assessmentis/clinical-domain'
import { Period, Reference } from '@assessmentis/clinical-domain/data-types'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { EncounterFormData } from '../schemas/encounter-form-schema'

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
  ClinicalDomainHub
> =>
  Effect.gen(function* () {
    const hub = yield* ClinicalDomainHub

    // Build updated encounter with form data
    let subject: Reference | undefined
    if (formData.patientUrl) {
      subject = Reference.make({
        reference: formData.patientUrl.toString(),
        type: 'Patient',
      })
    }

    let period: Period | undefined
    if (formData.periodStart || formData.periodEnd) {
      period = Period.make({
        start: formData.periodStart?.pipe(DateTime.toUtc),
        end: formData.periodEnd?.pipe(DateTime.toUtc),
      })
    }

    const physicalLocations: EncounterLocation[] = []
    if (formData.locationUrl) {
      physicalLocations.push(
        EncounterLocation.make({
          location: Reference.make({
            reference: formData.locationUrl.toString(),
            type: 'Location',
          }),
        })
      )
    }

    const updatedEncounter = currentEncounter.cloneWith({
      subject,
      // Update participant (practitioners)
      participant: formData.practitionerUrls?.map((practitionerUrl) =>
        EncounterParticipant.make({
          individual: Reference.make({
            reference: practitionerUrl.toString(),
            type: 'Practitioner',
          }),
        })
      ),
      period,
      // Update location references (preserve virtual/video room locations)
      location: [
        // Keep existing virtual location entries (video room)
        ...(currentEncounter.location?.filter((l) => isVirtualLocation(l)) ?? []),
        // Add user-selected physical location if provided
        ...physicalLocations,
      ],
    })

    return yield* hub.update(Encounter, updatedEncounter)
  })
