import { Effect, Schema } from 'effect'
import { useState, useMemo } from 'react'
import { PickerItem } from '../types/PickerTypes'
import { ClinicalDataRepository, Schemas } from '@assessmentis/clinical-domain'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../../../../../layers/PlatformContext'
import {
  ClinicalDataRepositoryService,
  ClinicalDataRepositoryServiceType,
} from '../../../../../layers/ClinicalDataRepositoriesService'

export interface UsePickerDataOptions<
  T extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  O,
> {
  resourceType: T['resourceType']
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

  const itemEffect = useMemo(
    () =>
      Effect.gen(function* () {
        const _ = refetchTrigger
        if (!enabled) return yield* Effect.fail({ _tag: 'Disabled' } as const)

        const service: ClinicalDataRepositoryServiceType =
          yield* ClinicalDataRepositoryService
        const repo = (yield* service[
          resourceType
        ]) as unknown as ClinicalDataRepository<T>
        const resources = yield* repo.getMany()
        return resources.map(transform)
      }).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      ),
    [
      clinicalDataRepositoryService,
      refetchTrigger,
      enabled,
      resourceType,
      transform,
    ]
  )

  const itemsPromise = useEffectTs(itemEffect)

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return [itemsPromise, refetch]
}
