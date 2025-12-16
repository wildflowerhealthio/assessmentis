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

    // Fetch all existing Media resources
    const existingMedia = yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })

    // Get media with fresh URLs from the video call service
    const { updatedMedia, newMedia } = yield* videoCalls.getMediaRecordedInRoom(
      roomName,
      existingMedia
    )

    // If no recordings found, return the encounter unchanged
    if (updatedMedia.length === 0 && newMedia.length === 0) return encounter

    // Update existing Media resources with fresh URLs
    for (const media of updatedMedia) {
      yield* mediaRepository.update(media)
    }

    // Create new Media resources linked to the encounter
    const newMediaToCreate = newMedia.map((media) => ({
      ...media,
      encounter: {
        reference: `Encounter/${encounterId}`,
      },
    }))

    if (newMediaToCreate.length > 0) {
      yield* mediaRepository.createMany(newMediaToCreate)
    }

    return encounter
  })
}
