import type { ResourceDataTypes } from '@assessmentis/clinical-domain'

import type { DomainTypedConstructor } from '../../traits/DomainTyped/DomainTyped'
import type {
  PickerItemConstructor,
  PickerItemInstance,
} from '../../traits/Picker/PickerItem'
import { PromisedDataPicker } from './internal/BasePicker'
import type { BasePickerProps } from './internal/PickerTypes'
import { usePickerData } from './internal/usePickerData'

export function ResourcePicker<
  K extends keyof ResourceDataTypes,
  Klass extends PickerItemConstructor & DomainTypedConstructor<K>,
>(
  props: { klass: Klass } & Omit<
    BasePickerProps<ResourceDataTypes[K] & PickerItemInstance>,
    'items' | 'loading'
  >
) {
  const [itemsPromise] = usePickerData({
    klass: props.klass,
    enabled: true,
  })

  return (
    <PromisedDataPicker
      {...props}
      itemsPromise={itemsPromise}
      immediate={props.immediate ?? true}
      placeholder={props.placeholder || props.klass.PickerItem.Placeholder}
      label={props.label || props.klass.PickerItem.Label}
    />
  )
}
