import type { Either, Stream } from 'effect'
import { useMemo } from 'react'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
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
 * @returns Stream of Either\<Resource[], Error\> that updates when matching resources change
 *
 * @remarks
 * The `filters` parameter is included in the `useMemo` dependency array by
 * reference. If you pass an inline object literal (e.g.
 * `useSearchSubscription(Patient, { name: 'Smith' })`), a new object is
 * created every render, which defeats memoization and causes a
 * re-subscription on every render cycle.
 *
 * Always pass a **stable reference** for `filters` — for example via
 * `useState`, `useMemo`, or a module-level constant.
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
export function useSearchSubscription<K extends ClinicalDomainClasses>(
  ResourceSchema: K,
  filters?: SearchFilters
): Stream.Stream<
  Either.Either<
    ReadonlyArray<Resource.WithResourceUrl<InstanceType<K>>>,
    ResourceRequest.CommonErrors
  >,
  never,
  never
> {
  const hub = useHub()

  return useMemo(
    () =>
      hub.subscribeSearch(
        ResourceSchema,
        filters satisfies
          | ResourceRequest.SearchParam<InstanceType<K>>
          | undefined
      ),
    [hub, ResourceSchema, filters]
  )
}
