import { Effect, Schema } from 'effect'
import { useMemo } from 'react'

import type {
  RepositoryFilters,
  ResourceDataTypes,
} from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { useCollectionPromise, useEitherStream } from '@assessmentis/react-util'

import type { HubResourceConstructor } from '../traits/HubResource'
import { useHub } from './useHub'
import { useSearchSubscription } from './useSearchSubscription'

const decodeUrl = Schema.decodeSync(ReadonlyUrl.FromString)

const urlKeyOf = <T extends { url?: ReadonlyUrl | undefined }>(
  item: T
): string | undefined => item.url?.toString()

/**
 * Hook for managing a reactive resource collection with CRUD operations
 * and per-item loading states.
 *
 * Combines Hub search subscription with optimistic create/delete support.
 *
 * @param ResourceSchema - The resource Schema class (e.g., Patient, Encounter)
 * @param filters - Optional search filters to narrow results
 * @returns Collection promise with deleteItem and createItem actions
 *
 * @example
 * ```typescript
 * import { Patient } from '@assessmentis/clinical-domain'
 *
 * function PatientListPage() {
 *   const { collectionPromise, deleteItem } = useResourceCollection(Patient)
 *   // collectionPromise resolves to Array<{ data: Patient; loading: boolean }>
 * }
 * ```
 */
export function useResourceCollection<
  TDomainType extends keyof ResourceDataTypes & string,
>(
  ResourceSchema: HubResourceConstructor<TDomainType>,
  filters?: RepositoryFilters<ResourceDataTypes[TDomainType]>
) {
  const hub = useHub()
  const domainType = ResourceSchema.DomainType

  const stream = useSearchSubscription(ResourceSchema, filters)
  const resourcesPromise = useEitherStream(stream)

  const actions = useMemo(
    () => ({
      apiDelete: (urlKey: string) =>
        Effect.runPromise(hub.delete(domainType, decodeUrl(urlKey))),
      apiCreate: (
        t: ResourceDataTypes[TDomainType]
      ): Promise<ResourceDataTypes[TDomainType]> =>
        Effect.runPromise(hub.create(domainType, t)),
    }),
    [hub, domainType]
  )

  return useCollectionPromise<ResourceDataTypes[TDomainType]>(
    actions,
    resourcesPromise,
    urlKeyOf
  )
}
