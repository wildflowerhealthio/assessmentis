import { Either, Stream } from 'effect'
import { useMemo, useState } from 'react'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { StreamEither } from '../../../../../../global/util/src/stream'
import { useHub } from '../../../layers/useHub'
import type { DomainTypedConstructor } from '../../../traits/DomainTyped/DomainTyped'
import type {
  PickerItemConstructor,
  PickerItemInstance,
} from '../../../traits/Picker/PickerItem'

export interface UsePickerDataOptions<
  K extends PickerItemConstructor &
    DomainTypedConstructor<keyof ResourceDataTypes>,
> {
  klass: K
  enabled?: boolean
}

export function usePickerData<
  TDomainType extends keyof ResourceDataTypes,
  K extends PickerItemConstructor & DomainTypedConstructor<TDomainType>,
>(
  options: UsePickerDataOptions<K>
): [
  Promise<(ResourceDataTypes[K['DomainType']] & PickerItemInstance)[]>,
  () => void,
] {
  const { klass, enabled = true } = options
  const hub = useHub()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const itemStream: Stream.Stream<
    Either.Either<
      (ResourceDataTypes[K['DomainType']] & PickerItemInstance)[],
      ResourceRequest.CommonErrors | { _tag: 'Disabled' }
    >,
    never,
    never
  > = useMemo(() => {
    if (!enabled) {
      return Stream.succeed(Either.left({ _tag: 'Disabled' } as const))
    }

    return StreamEither.map(
      hub.subscribeSearch(klass.DomainType),
      (resources) =>
        // TODO: URGENT this doesn't hold, update hub to use outer classes
        resources.map((r) => r as typeof r & PickerItemInstance)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub, refetchTrigger, enabled, klass.DomainType])

  const itemsPromise = useEitherStream(itemStream)

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return [itemsPromise, refetch]
}
