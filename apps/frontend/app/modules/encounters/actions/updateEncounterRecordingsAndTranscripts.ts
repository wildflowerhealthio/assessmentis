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

/**
 * Fetches recordings for an encounter's video call room and updates the encounter
 * with references to the recordings.
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
  EncounterRepository | ExternalVideoCallClient
> => {
  return Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const videoCalls = yield* ExternalVideoCallClient

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

    // Update the encounter with recording URIs
    const recordingFileUrls: ExternalVideoCallRecordingFileUrl[] = recordings
      .map((rec) => rec.recordingFileUrl)
      .filter((url): url is ExternalVideoCallRecordingFileUrl => !!url)
    const updatedEncounter = withRecordingFileUrls(encounter, recordingFileUrls)

    // Save the updated encounter
    const savedEncounter = yield* encounterRepository.update(updatedEncounter)

    return savedEncounter
  })
}
