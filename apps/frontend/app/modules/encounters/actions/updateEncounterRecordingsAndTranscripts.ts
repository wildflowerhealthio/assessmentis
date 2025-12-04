import { Effect } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
} from '@assessmentis/domain/video-calls'
import {
  EncounterRepository,
  withRecordingReference,
  withTranscriptReference,
  getVideoCallRoomName,
} from '@assessmentis/domain/encounters'
import {
  NeedsAuthenticationError,
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/domain/errors'
import { WithId } from '@assessmentis/domain/general-purpose'
import { Encounter, EncounterId } from '@assessmentis/domain/encounters'

/**
 * Fetches recordings for an encounter's video call room and updates the encounter
 * with references to the recording and transcript if available.
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
    const encounter = yield* encounterRepository.getEncounter(encounterId)

    // Extract the room name from the encounter extensions
    const roomName = getVideoCallRoomName(encounter)

    if (!roomName) {
      // If no room name is found, return the encounter unchanged
      return encounter
    }

    // Fetch recordings for the room
    const recordings = yield* videoCalls.fetchRecordingsByRoomName(roomName)

    // If no recordings found yet, return the encounter unchanged
    if (recordings.length === 0) {
      return encounter
    }

    // Use the first (most recent) recording
    const recording = recordings[0]
    const recordingId = recording.externalVideoCallRecordingId

    // Try to fetch the transcript for this recording
    const transcript =
      yield* videoCalls.fetchTranscriptByRecordingId(recordingId)

    // Update the encounter with recording and transcript references
    let updatedEncounter = withRecordingReference(encounter, recordingId)

    if (transcript) {
      updatedEncounter = withTranscriptReference(
        updatedEncounter,
        transcript.transcriptText
      )
    }

    // Save the updated encounter
    const savedEncounter =
      yield* encounterRepository.updateEncounter(updatedEncounter)

    return savedEncounter
  })
}
