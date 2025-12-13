import { Effect } from 'effect'
import {
  NeedsAuthenticationError,
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/clinical-domain/errors'
import { WithId } from '@assessmentis/clinical-domain/general-purpose'
import { EncounterId } from '@assessmentis/clinical-domain/encounters'
import {
  Media,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'

/**
 * Fetches Media resources (recordings) linked to an encounter.
 *
 * @param encounterId - The ID of the encounter
 * @returns Array of Media resources linked to the encounter
 */
export const getEncounterRecordings = (
  encounterId: EncounterId
): Effect.Effect<
  WithId<Media>[],
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  MediaRepository
> => {
  return Effect.gen(function* () {
    const mediaRepository = yield* MediaRepository

    // Fetch all Media resources and filter by encounter reference
    // Note: The current FHIR search implementation doesn't support filtering parameters,
    // so we filter in memory. This is consistent with other repository implementations.
    const allMedia = yield* mediaRepository.getMany({})

    const encounterMedia = allMedia.filter(
      (media) =>
        media.encounter?.reference === `Encounter/${encounterId}` ||
        media.encounter?.reference === encounterId
    )

    return encounterMedia
  })
}
