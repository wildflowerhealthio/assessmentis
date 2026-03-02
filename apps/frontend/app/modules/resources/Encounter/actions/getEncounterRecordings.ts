import { Effect } from 'effect'
import type {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import type { Resource } from '@assessmentis/effectful-store'
import type { Encounter, Media } from '@assessmentis/clinical-domain'
import { MediaRepository } from '@assessmentis/clinical-domain/repositories'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

/**
 * Fetches Media resources (recordings) linked to an encounter.
 *
 * @param encounterId - The ID of the encounter
 * @returns Array of Media resources linked to the encounter
 */
export const getEncounterRecordings = (
  encounterId: string
): Effect.Effect<
  ReadonlyArray<Resource.WithResourceUrl<Media>>,
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | AuthzError
  | NotFoundError<'Encounter', { url: string }>,
  MediaRepository
> => {
  return Effect.gen(function* () {
    const mediaRepository = yield* MediaRepository

    return yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })
  })
}
