import { Effect } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
} from '@assessmentis/domain/video-calls'
import {
  EncounterRepository,
  withRecordings,
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
    const encounter = yield* encounterRepository.getEncounter(encounterId)

    // Extract the room name from the encounter location
    const roomName = encounter.location?.[0]?.location?.identifier?.value

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

    // Update the encounter with recording URIs
    const updatedEncounter = withRecordings(
      encounter,
      recordings.map((rec) => rec.uri)
    )

    // Save the updated encounter
    const savedEncounter =
      yield* encounterRepository.updateEncounter(updatedEncounter)

    return savedEncounter
  })
}
