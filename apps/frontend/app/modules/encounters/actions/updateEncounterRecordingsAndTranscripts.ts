import { Effect, Duration } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
} from '@assessmentis/clinical-domain/video-calls'
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
import {
  Media,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'

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
  | ExternalVideoCallServiceError
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

    const recordings = yield* videoCalls.fetchRecordingsByRoomName(roomName)

    // If no recordings found yet, return the encounter unchanged
    if (recordings.length == 0) return encounter

    // Fetch all existing Media resources once to check for duplicates
    const existingMedia = yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })
    const existingIds = new Set(
      existingMedia
        .flatMap((media) => media.identifier?.map(({ value }) => value) ?? [])
        .filter((id) => !!id)
    )

    for (const media of existingMedia) {
      const recording = recordings.find((recording) =>
        media.identifier?.some(
          (identifier) =>
            identifier.value === recording.externalVideoCallRecordingId
        )
      )
      if (!recording) continue
      yield* mediaRepository.update({
        ...media,
        content: {
          url: recording.recordingFileUrl,
        },
      })
    }

    // Create Media resources for recordings that don't exist yet
    const newMediaToCreate: Media[] = recordings
      .filter(
        (recording) =>
          recording.recordingFileUrl &&
          !existingIds.has(recording.externalVideoCallRecordingId)
      )
      .map(
        (recording): Media => ({
          resourceType: 'Media',
          status: 'completed',
          encounter: {
            reference: `Encounter/${encounterId}`,
          },
          identifier: [
            {
              value: recording.externalVideoCallRecordingId,
            },
          ],
          createdDateTime: recording.startedAt,
          duration: Duration.toSeconds(recording.duration),
          content: {
            url: recording.recordingFileUrl,
          },
        })
      )

    // Create all new Media resources in one batch
    const newMediaCreated = newMediaToCreate.length > 0
    if (newMediaCreated) {
      yield* mediaRepository.createMany(newMediaToCreate)
    }

    return encounter
  })
}
