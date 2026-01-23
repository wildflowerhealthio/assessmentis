import { Effect } from 'effect'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import { WithId } from '@assessmentis/clinical-domain/data-types'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import {
  Media,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { AuthError, AuthzError } from '@assessmentis/ontology'

/**
 * Fetches Media resources (recordings) linked to an encounter.
 *
 * @param encounterId - The ID of the encounter
 * @returns Array of Media resources linked to the encounter
 */
export const getEncounterRecordings = (
  encounterId: EncounterId
): Effect.Effect<
  ReadonlyArray<WithId<Media>>,
  | UnhandledError
  | ExternalAssertionError
  | AuthError
  | AuthzError
  | NotFoundError,
  MediaRepository
> => {
  return Effect.gen(function* () {
    const mediaRepository = yield* MediaRepository

    return yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })
  })
}
