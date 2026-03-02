import { Effect } from 'effect'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { Encounter, Media } from '@assessmentis/clinical-domain'
import { IdentifierAndReference } from '@assessmentis/clinical-domain/data-types'
import {
  EncounterRepository,
  MediaRepository,
} from '@assessmentis/clinical-domain/repositories'
import type {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import type { Resource } from '@assessmentis/effectful-store'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

/**
 * Fetches recordings for an encounter's video call room and creates Media resources
 * linked to the encounter.
 *
 * @param encounterId - The ID of the encounter to update
 */
export const updateEncounterRecordingsAndTranscripts = (
  encounterId: string
): Effect.Effect<
  Resource.WithResourceUrl<Encounter>,
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { url: string }>
  | NotFoundError<'Media', { url: string }>
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

    const updatedMedia: Resource.WithResourceUrl<Media>[] = []
    const newRecordings: Media[] = []

    for (const recording of latestRecordings) {
      // Find the corresponding existing media and update it with fresh URL
      const correspondingMedia = knownMediaItems.find((known) =>
        known.identifier?.some((knownId: { value?: string }) =>
          recording.identifier?.some((id: { value?: string }) => id.value === knownId.value)
        )
      )
      if (correspondingMedia) {
        const updated: Resource.WithResourceUrl<Media> = {
          ...correspondingMedia,
          content: recording.content,
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
    const encounterRef = IdentifierAndReference.Reference.make({
      reference: `Encounter/${encounterId}`,
    })
    const mediaToCreate: Media[] = newRecordings.map((media) => ({
      ...media,
      encounter: encounterRef,
    }))

    if (mediaToCreate.length > 0) {
      yield* mediaRepository.createMany(mediaToCreate)
    }

    return encounter
  })
}
