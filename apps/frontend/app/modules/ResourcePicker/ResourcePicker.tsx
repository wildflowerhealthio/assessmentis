import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'

import type { PickerItemConstructor } from '../../traits/Picker/PickerItem'
import { PromisedDataPicker } from './internal/BasePicker'
import type { BasePickerProps } from './internal/PickerTypes'
import { usePickerData } from './internal/usePickerData'

export function ResourcePicker<
  K extends ClinicalDomainClasses & PickerItemConstructor,
>(
  props: { klass: K } & Omit<
    BasePickerProps<InstanceType<K>>,
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
