import { Effect } from 'effect'

import {
  ClinicalDomainHub,
  Encounter,
  Media,
} from '@assessmentis/clinical-domain'
import { Reference } from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { VideoCallClient } from '@assessmentis/video-call-domain'

/**
 * Fetches recordings for an encounter's video call room and creates Media resources
 * linked to the encounter.
 *
 * @param encounterUrl - The URL of the encounter to update
 */
export const updateEncounterRecordingsAndTranscripts = (
  encounterUrl: Resource.InferResourceUrl<Encounter>
): Effect.Effect<
  Resource.WithResourceUrl<Encounter>,
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError
  | NotFoundError<'Encounter', { url: Resource.InferResourceUrl<Encounter> }>
  | NotFoundError<'Media', { url: Resource.InferResourceUrl<Media> }>
  | NotFoundError<'Recording', { id: string }>,
  ClinicalDomainHub | VideoCallClient
> => {
  return Effect.gen(function* () {
    const hub = yield* ClinicalDomainHub
    const videoCalls = yield* VideoCallClient

    // Get the current encounter
    const encounter = yield* hub.get(Encounter, encounterUrl)

    // Extract the room name from the encounter location
    const roomUrl = encounter.location?.[0]?.location?.identifier?.value

    // If no room name is found, return the encounter unchanged
    if (!roomUrl) return encounter

    // Fetch recordings for the room
    const roomName = videoCalls.extractRoomNameFromUrl(roomUrl)
    if (!roomName) return encounter

    // Fetch all existing Media resources
    const knownMediaItems = yield* hub.search(Media, {
      encounter: `Encounter/${encounterUrl}`,
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
          recording.identifier?.some(
            (id: { value?: string }) => id.value === knownId.value
          )
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

    yield* Effect.all(updatedMedia.map((media) => hub.update(Media, media)))

    // Create new Media resources linked to the encounter
    const encounterRef = Reference.make({
      reference: `Encounter/${encounterUrl}`,
    })
    const mediaToCreate: Media[] = newRecordings.map((media) => ({
      ...media,
      encounter: encounterRef,
    }))

    if (mediaToCreate.length > 0) {
      yield* hub.createMany(Media, mediaToCreate)
    }

    return encounter
  })
}
