import { Effect, Schema } from 'effect'
import { useMemo } from 'react'

import type { ClinicalDomainClasses, RepositoryFilters } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { useCollectionPromise, useEitherStream } from '@assessmentis/react-util'

import { useHub } from './use-hub'
import { useSearchSubscription } from './use-search-subscription'

const decodeUrl = Schema.decodeSync(ReadonlyUrl.FromString)

const urlKeyOf = <T extends { url?: ReadonlyUrl | undefined }>(item: T): string | undefined =>
  item.url?.toString()

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
export function useResourceCollection<K extends ClinicalDomainClasses>(
  ResourceSchema: K,
  filters?: RepositoryFilters<InstanceType<K>>
): {
  collectionPromise: Promise<readonly { data: InstanceType<K>; loading: boolean }[]>
  createItem: (t: InstanceType<K>) => void
  deleteItem: (key?: string) => Promise<void>
} {
  const hub = useHub()

  const stream = useSearchSubscription(ResourceSchema, filters)
  const resourcesPromise = useEitherStream(stream)

  const actions = useMemo(
    () => ({
      apiCreate: (t: InstanceType<K>): Promise<InstanceType<K>> =>
        Effect.runPromise(hub.create(ResourceSchema, t)),
      apiDelete: (urlKey: string): Promise<void> =>
        Effect.runPromise(hub.delete(ResourceSchema, decodeUrl(urlKey))),
    }),
    [hub, ResourceSchema]
  )

  return useCollectionPromise<InstanceType<K>>(actions, resourcesPromise, urlKeyOf)
}
