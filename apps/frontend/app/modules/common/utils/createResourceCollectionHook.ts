import { Effect, Schema } from 'effect'
import { useMemo } from 'react'
import { RepositoryFilters, Schemas } from '@assessmentis/clinical-domain'

import { useClinicalDataCollectionPromise } from '../hooks/useClinicalDataCollection'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../../../layers/PlatformContext'
import {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'

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
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
>(config: { resourceType: TResource['resourceType'] }) {
  return (filters?: RepositoryFilters<TResource>) => {
    const { clinicalDataRepositoryService } = usePlatformContext()

    const repoEffect = useMemo(() => {
      return clinicalDataRepositoryService.repositoryEffect<TResource>(
        config.resourceType
      )
    }, [clinicalDataRepositoryService])

    const resourcesEffect = useMemo(() => {
      return Effect.flatMap(repoEffect, (repository) =>
        repository.getMany(filters)
      )
    }, [repoEffect, filters])

    const resourcesPromise = useEffectTs(resourcesEffect)

    return useClinicalDataCollectionPromise<
      TResource,
      | UnhandledError
      | ExternalAssertionError
      | NotFoundError<TResource['resourceType'], { id: TResource['id'] }>
      | NoSelectedOrgError
      | AuthError
    >(repoEffect, resourcesPromise)
  }
}
