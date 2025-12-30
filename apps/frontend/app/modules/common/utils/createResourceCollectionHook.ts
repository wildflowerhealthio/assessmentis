import { Effect } from 'effect'
import { useMemo } from 'react'
import {
  BaseClinicalDataRepository,
  ExtractResourceTypes,
} from '@assessmentis/clinical-domain'
import { ReadonlyTag } from 'effect/Context'
import { useResourceRunEffect } from '../../../clientRuntime'
import { useClinicalDataCollection } from '../hooks/useClinicalDataCollection'
import { ExtractService, ExtractTag } from '../../global/util/typeUtils'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TRepoTag extends ReadonlyTag<any, BaseClinicalDataRepository<any, any>>,
>(config: { repository: TRepoTag }) {
  type Service = ExtractService<TRepoTag>
  type Types = ExtractResourceTypes<Service>
  type TResource = Types['resource']
  type TId = Types['id']
  type TTag = ExtractTag<TRepoTag>

  return (filters?: object) => {
    const resources = useResourceRunEffect(
      useMemo(() => {
        return Effect.gen(function* () {
          const repository = yield* config.repository
          return yield* repository.getMany(filters)
        })
      }, [filters])
    )

    return useClinicalDataCollection<TId, TResource, TTag, TRepoTag, never>(
      config.repository,
      resources
    )
  }
}
