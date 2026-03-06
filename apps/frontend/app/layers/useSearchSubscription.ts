import type { Either, Stream } from 'effect'
import { useMemo } from 'react'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import type { Resource, ResourceRequest } from '@assessmentis/effectful-store'

import { useHub } from './useHub'

/** Loose filter record that both RepositoryFilters and SearchParam satisfy. */
type SearchFilters = Partial<
  Record<string, string | ReadonlyArray<string> | undefined>
>

/**
 * Hook for subscribing to a collection of resources via search filters.
 *
 * Parallel to `useResourceSubscription` (single resource by URL), this hook
 * subscribes to search results that update reactively when the Hub state changes.
 *
 * @param ResourceSchema - The resource Schema class (e.g., Patient, Encounter)
 * @param filters - Optional search filters to narrow results
 * @returns Stream of Either<Resource[], Error> that updates when matching resources change
 *
 * @example
 * ```typescript
 * import { Patient } from '@assessmentis/clinical-domain'
 *
 * function PatientList() {
 *   const stream = useSearchSubscription(Patient, { name: 'Smith' })
 *   const patientsPromise = useEitherStream(stream)
 *   // ...
 * }
 * ```
 */
export function useSearchSubscription<
  TDomainType extends keyof ResourceDataTypes,
>(
  ResourceSchema: {
    readonly DomainType: TDomainType
  },
  filters?: SearchFilters
): Stream.Stream<
  Either.Either<
    ReadonlyArray<Resource.WithResourceUrl<ResourceDataTypes[TDomainType]>>,
    ResourceRequest.CommonErrors
  >,
  never,
  never
> {
  const hub = useHub()

  return useMemo(
    () =>
      hub.subscribeSearch(
        ResourceSchema.DomainType,
        filters satisfies
          | ResourceRequest.SearchParam<ResourceDataTypes[TDomainType]>
          | undefined
      ),
    [hub, ResourceSchema.DomainType, filters]
  )
}
