import { Either, Stream } from 'effect'
import { useMemo, useState } from 'react'

import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'
import type { Resource, ResourceRequest } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { useHub } from '../../../layers/useHub'
import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'

export interface UsePickerDataOptions<K extends ClinicalDomainClasses> {
  klass: K
  enabled?: boolean
}

type DisabledTag = { readonly _tag: 'Disabled' }

export function usePickerData<K extends ClinicalDomainClasses>(
  options: UsePickerDataOptions<K>
): [Promise<InstanceType<K>[]>, () => void] {
  const { klass, enabled = true } = options
  const hub = useHub()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  type ItemStream = Stream.Stream<
    Either.Either<
      readonly Resource.WithResourceUrl<InstanceType<K>>[],
      ResourceRequest.CommonErrors | DisabledTag
    >,
    never,
    never
  >

  const itemStream: ItemStream = useMemo(() => {
    if (!enabled) {
      return Stream.succeed<
        Either.Either<
          readonly Resource.WithResourceUrl<InstanceType<K>>[],
          DisabledTag
        >
      >(Either.left({ _tag: 'Disabled' } as const))
    }

    return hub.subscribeSearch(klass)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub, refetchTrigger, enabled, klass])

  // Module augmentation ensures InstanceType<K> has PickerItemInstance at
  // runtime when the caller constrains K to PickerItemConstructor. The
  // widened return promise carries the intersection so downstream
  // components see the picker properties.
  const itemsPromise = useEitherStream(itemStream) as Promise<InstanceType<K>[]>

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return [itemsPromise, refetch]
}
