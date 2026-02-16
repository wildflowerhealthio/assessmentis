import { Effect } from 'effect'
import type {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import type { WithId } from '@assessmentis/effectful-store'
import type { EncounterId } from '@assessmentis/clinical-domain/administration'
import type { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { MediaRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

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
  | NotFoundError<'Encounter', { id: EncounterId }>,
  MediaRepository
> => {
  return Effect.gen(function* () {
    const mediaRepository = yield* MediaRepository

    return yield* mediaRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })
  })
}
