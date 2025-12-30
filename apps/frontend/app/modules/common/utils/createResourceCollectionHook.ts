import { Effect } from 'effect'
import { useMemo } from 'react'
import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { ReadonlyTag } from 'effect/Context'
import { useResourceRunEffect } from '../../../clientRuntime'
import { useClinicalDataCollection } from '../hooks/useClinicalDataCollection'

/**
 * Extract the service type from a ReadonlyTag
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractService<T> = T extends ReadonlyTag<any, infer S> ? S : never

/**
 * Extract TId and TResource from a BaseClinicalDataRepository
 */
type ExtractResourceTypes<T> =
  T extends BaseClinicalDataRepository<infer TResource, infer TId>
    ? { resource: TResource; id: TId }
    : never

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

  return (filters: object) => {
    const resources = useResourceRunEffect(
      useMemo(() => {
        return Effect.gen(function* () {
          const repository = yield* config.repository
          return yield* repository.getMany(filters)
        })
      }, [filters])
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useClinicalDataCollection<TId, TResource, any, TRepoTag, never>(
      config.repository,
      resources
    )
  }
}
