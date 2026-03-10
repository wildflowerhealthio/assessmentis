import { Effect } from 'effect'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { EncounterRepository } from '@assessmentis/clinical-domain/administration'
import type {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
  AuthError,
  AuthzError,
} from '@assessmentis/ontology'
import type { WithId } from '@assessmentis/clinical-domain/data-types'
import type {
  Encounter,
  EncounterId,
} from '@assessmentis/clinical-domain/administration'
import type {
  Media,
  MediaId,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
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
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { id: EncounterId }>
  | NotFoundError<'Media', { id: MediaId }>
  | NotFoundError<'Recording', { id: string }>,
  EncounterRepository | VideoCallClient | MediaRepository
> => {
  return Effect.gen(function* () {
    const encounterRepository = yield* EncounterRepository
    const videoCalls = yield* VideoCallClient
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
    const knownMediaItems = yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })

    // Get media with fresh URLs from the video call service
    const latestRecordings = yield* videoCalls.getMediaRecordedInRoom(roomName)

    // If no recordings found, return the encounter unchanged
    if (latestRecordings.length === 0) {
      return encounter
    }

    const updatedMedia: WithId<Media>[] = []
    const newRecordings: Media[] = []

    for (const recording of latestRecordings) {
      // Find the corresponding existing media and update it with fresh URL
      const correspondingMedia = knownMediaItems.find((known) =>
        known.identifier?.some((knownId) =>
          recording.identifier?.some((id) => id.value === knownId.value)
        )
      )
      if (correspondingMedia) {
        const updated: WithId<Media> = {
          ...correspondingMedia,
          content: recording.content,
          id: correspondingMedia.id,
        }
        updatedMedia.push(updated)
      } else {
        newRecordings.push(recording)
      }
    }

    // Update existing Media resources with fresh URLs
    // TODO: Investigate bulk update support in MediaRepository
    for (const media of updatedMedia) {
      yield* mediaRepository.update(media)
    }

    // Create new Media resources linked to the encounter
    const mediaToCreate = newRecordings.map((media) => ({
      ...media,
      encounter: {
        reference: `Encounter/${encounterId}`,
      },
    }))

    if (mediaToCreate.length > 0) {
      yield* mediaRepository.createMany(mediaToCreate)
    }

    return encounter
  })
}
