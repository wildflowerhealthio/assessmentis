import type { Schema } from 'effect'
import { Effect, Stream, Option } from 'effect'
import { useMemo } from 'react'
import type { RepositoryFilters, Schemas } from '@assessmentis/clinical-domain'

import { useClinicalDataCollectionPromise } from '../hooks/useClinicalDataCollection'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../../../layers/PlatformContext'
import type {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { StreamEither } from '@assessmentis/util'

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

    const repoStream = useMemo(() => {
      return clinicalDataRepositoryService.repositoryStream(config.resourceType)
    }, [clinicalDataRepositoryService])

    const repoEffect = useMemo(
      () =>
        Stream.runHead(repoStream).pipe(
          Effect.flatMap(Option.getOrThrow),
          Effect.scoped
        ),
      [repoStream]
    )

    const resourcesStream = useMemo(() => {
      return StreamEither.mapEffect(repoStream, (repository) =>
        repository.getMany(filters)
      )
    }, [repoStream, filters])

    const resourcesPromise = useEitherStream(resourcesStream)

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
