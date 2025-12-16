import { Effect } from 'effect'
import { ExternalVideoCallClient } from '@assessmentis/clinical-domain/video-calls'
import { EncounterRepository } from '@assessmentis/clinical-domain/encounters'
import {
  NeedsAuthenticationError,
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/clinical-domain/errors'
import { WithId } from '@assessmentis/clinical-domain/general-purpose'
import {
  Encounter,
  EncounterId,
} from '@assessmentis/clinical-domain/encounters'
import { MediaRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'

/**
 * Fetches recordings for an encounter's video call room and creates Media resources
 * linked to the encounter.
 *
 * @param encounterId - The ID of the encounter to update
 */
export const updateEncounterRecordingsAndTranscripts = (
  encounterId: EncounterId
): Effect.Effect<
  WithId<Encounter>,
  | UnhandledError
  | NeedsAuthenticationError
  | ExternalAssertionError
  | NotFoundError,
  EncounterRepository | ExternalVideoCallClient | MediaRepository
> => {
  return Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const videoCalls = yield* ExternalVideoCallClient
    const mediaRepository = yield* MediaRepository

    // Get the current encounter
    const encounter = yield* encounterRepository.get(encounterId)

    // Extract the room name from the encounter location
    const roomUrl = encounter.location?.[0]?.location?.identifier?.value

    // If no room name is found, return the encounter unchanged
    if (!roomUrl) return encounter

    // Fetch recordings for the room
    const roomName = videoCalls.extractRoomNameFromUrl(roomUrl)
    if (!roomName) return encounter

    const mediaFromRecordings =
      yield* videoCalls.fetchRecordingsByRoomName(roomName)

    // If no recordings found yet, return the encounter unchanged
    if (mediaFromRecordings.length == 0) return encounter

    // Fetch all existing Media resources once to check for duplicates
    const existingMedia = yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })
    const existingIds = new Set(
      existingMedia
        .flatMap((media) => media.identifier?.map(({ value }) => value) ?? [])
        .filter((id) => !!id)
    )

    // Update existing Media resources with new URLs if needed
    for (const media of existingMedia) {
      const newMedia = mediaFromRecordings.find((recording) =>
        media.identifier?.some((id1) =>
          recording.identifier?.some((id2) => id2.value === id1.value)
        )
      )
      if (!newMedia) continue
      yield* mediaRepository.update({
        ...media,
        content: newMedia.content,
      })
    }

    // Create Media resources for recordings that don't exist yet
    // Link them to the encounter
    // A media is new if NONE of its identifiers exist in the database
    const newMediaToCreate = mediaFromRecordings
      .filter(
        (media) =>
          !media.identifier?.some((identifier) =>
            existingIds.has(identifier.value)
          )
      )
      .map((media) => ({
        ...media,
        encounter: {
          reference: `Encounter/${encounterId}`,
        },
      }))

    // Create all new Media resources in one batch
    const newMediaCreated = newMediaToCreate.length > 0
    if (newMediaCreated) {
      yield* mediaRepository.createMany(newMediaToCreate)
    }

    return encounter
  })
}
