import { Effect } from 'effect'
import { useMemo } from 'react'
import {
  BaseClinicalDataRepository,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'
import { ReadonlyTag } from 'effect/Context'
import { useResourceRunEffect } from '../../../clientRuntime'
import { useClinicalDataCollection } from '../hooks/useClinicalDataCollection'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'

/**
 * Creates a resource collection hook with standardized behavior
 *
 * This factory function reduces duplication across resource collection hooks by
 * encapsulating the common pattern of:
 * 1. Using useResourceRunEffect with Effect.gen to get resources from repository
 * 2. Using useClinicalDataCollection to manage the collection state
 *
 * @example
 * ```typescript
 * export const usePatientCollection = createResourceCollectionHook({
 *   repository: PatientRepository
 * })
 * ```
 */
export function createResourceCollectionHook<
  TagId extends ClientRuntimeContext,
  TId extends string,
  TResource extends { id?: TId },
  TRepoTag extends ReadonlyTag<
    TagId,
    BaseClinicalDataRepository<TResource, TId>
  >,
>(config: { repository: TRepoTag }) {
  return (filters?: RepositoryFilters<TResource>) => {
    const resources = useResourceRunEffect(
      useMemo(() => {
        return Effect.gen(function* () {
          const repository = yield* config.repository
          return yield* repository.getMany(filters)
        })
      }, [filters])
    )

    return useClinicalDataCollection<TId, TResource, TagId, TRepoTag, never>(
      config.repository,
      resources
    )
  }
}
