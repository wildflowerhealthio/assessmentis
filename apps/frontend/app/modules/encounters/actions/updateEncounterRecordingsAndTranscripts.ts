import { Effect } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallRecordingFileUrl,
  ExternalVideoCallServiceError,
} from '@assessmentis/clinical-domain/video-calls'
import {
  EncounterRepository,
  withRecordingFileUrls,
} from '@assessmentis/clinical-domain/encounters'
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

    // Create Media resources for each recording
    const recordingFileUrls: ExternalVideoCallRecordingFileUrl[] = recordings
      .map((rec) => rec.recordingFileUrl)
      .filter((url): url is ExternalVideoCallRecordingFileUrl => !!url)

    // Fetch all existing Media resources once to check for duplicates
    const existingMedia = yield* mediaRepository.getMany({})
    const existingUrls = new Set(
      existingMedia.map((media) => media.content.url).filter((url) => !!url)
    )

    // Create Media resources for recordings that don't exist yet
    let newMediaCreated = false
    for (const recordingUrl of recordingFileUrls) {
      if (!existingUrls.has(recordingUrl)) {
        const media: Media = {
          resourceType: 'Media',
          status: 'completed',
          encounter: {
            reference: `Encounter/${encounterId}`,
          },
          content: {
            url: recordingUrl,
          },
        }
        yield* mediaRepository.create(media)
        newMediaCreated = true
      }
    }

    // Update encounter extensions for backward compatibility only if something changed
    if (newMediaCreated) {
      const updatedEncounter = withRecordingFileUrls(
        encounter,
        recordingFileUrls
      )
      return yield* encounterRepository.update(updatedEncounter)
    }

    return encounter
  })
}
