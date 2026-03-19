import type { ClinicalDomainClasses } from '@assessmentis/clinical-domain'

import type { PickerItemConstructor } from '../../traits/Picker/picker-item'
import { PromisedDataPicker } from './internal/base-picker'
import type { BasePickerProps } from './internal/picker-types'
import { usePickerData } from './internal/use-picker-data'

export function ResourcePicker<K extends ClinicalDomainClasses & PickerItemConstructor>(
  props: { klass: K } & Omit<BasePickerProps<InstanceType<K>>, 'items' | 'loading'>
): React.JSX.Element {
  const [itemsPromise] = usePickerData({
    enabled: true,
    klass: props.klass,
  })

  return (
    <PromisedDataPicker
      {...props}
      itemsPromise={itemsPromise}
      immediate={props.immediate ?? true}
      placeholder={props.placeholder ?? props.klass.PickerItem.Placeholder}
      label={props.label ?? props.klass.PickerItem.Label}
    />
  )
}
