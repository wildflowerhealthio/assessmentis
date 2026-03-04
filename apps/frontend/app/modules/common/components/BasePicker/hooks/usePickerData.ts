import { Effect, Either, Stream, type Schema, type Scope } from 'effect'
import { useMemo, useState } from 'react'

import type {
  ClinicalDataRepository,
  ClinicalDataRepositoryErrors,
  Schemas,
} from '@assessmentis/clinical-domain'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import type { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { useEitherStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import {
  ClinicalDataRepositoryService,
  type ClinicalDataRepositoryServiceType,
} from '../../../../../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../../../../../layers/PlatformContext'
import type { PickerItem } from '../types/PickerTypes'

export interface UsePickerDataOptions<
  T extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  O,
> {
  resourceType: T['domainType']
  transform: (item: T) => PickerItem<O>
  enabled?: boolean
}

type UsePickerDataResult<O> = [Promise<PickerItem<O>[]>, () => void]

export function usePickerData<
  T extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  O,
>(options: UsePickerDataOptions<T, O>): UsePickerDataResult<O> {
  const { resourceType, transform, enabled = true } = options
  const { clinicalDataRepositoryService } = usePlatformContext()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const itemStream: Stream.Stream<
    Either.Either<
      PickerItem<O>[],
      NoSelectedOrgError | ClinicalDataRepositoryErrors | { _tag: 'Disabled' }
    >,
    never,
    Scope.Scope
  > = useMemo(
    () =>
      enabled
        ? Stream.unwrap(
            Effect.gen(function* () {
              const _ = refetchTrigger

              const service: ClinicalDataRepositoryServiceType =
                yield* ClinicalDataRepositoryService
              const repoStream = service.stream[
                resourceType
              ] as unknown as Stream.Stream<
                Either.Either<
                  ClinicalDataRepository<T>,
                  AuthError | NoSelectedOrgError | UnhandledError
                >,
                never,
                Scope.Scope
              >
              return repoStream.pipe(
                StreamEither.mapEffect((repo) =>
                  Effect.map(repo.getMany(), (resources) =>
                    resources.map(transform)
                  )
                )
              )
            }).pipe(
              Effect.provideService(
                ClinicalDataRepositoryService,
                clinicalDataRepositoryService
              )
            )
          )
        : Stream.succeed(Either.left({ _tag: 'Disabled' } as const)),
    [
      clinicalDataRepositoryService,
      refetchTrigger,
      enabled,
      resourceType,
      transform,
    ]
  )

  const itemsPromise = useEitherStream(itemStream)

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return [itemsPromise, refetch]
}
