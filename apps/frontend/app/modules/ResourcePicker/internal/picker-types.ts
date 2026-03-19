import type { PickerItemInstance } from '../../../traits/Picker/picker-item'
import type { PickerSelectionProps } from './use-picker-selection'

export interface CommonPickerProps<T extends PickerItemInstance> {
  picking: PickerSelectionProps

  // Display
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  immediate?: boolean

  // Filtering
  filterFn?: (item: T, query: string) => boolean

  // Rendering
  renderItem?: (item: T) => React.ReactNode
  renderSelectedItem?: (item: T) => React.ReactNode

  // Styling
  className?: string
}

export interface BasePickerProps<T extends PickerItemInstance> extends CommonPickerProps<T> {
  items: readonly T[]
  loading?: boolean
  error?: string
}

export interface PromisedPickerProps<T extends PickerItemInstance> extends CommonPickerProps<T> {
  itemsPromise: Promise<readonly T[]>
}
