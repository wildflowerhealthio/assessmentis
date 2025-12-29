import { PickerSelectionProps } from '../hooks/usePickerSelection'

export interface PickerItem<T> {
  id: string
  displayName: string
  secondaryText?: string
  metadata?: undefined | T
}

export interface BasePickerProps<T> {
  items: ReadonlyArray<PickerItem<T>>
  picking: PickerSelectionProps
  loading?: boolean

  // Display
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  immediate?: boolean

  // Filtering
  filterFn?: (item: PickerItem<T>, query: string) => boolean

  // Rendering
  renderItem?: (item: PickerItem<T>) => React.ReactNode
  renderSelectedItem?: (item: PickerItem<T>) => React.ReactNode

  // Styling
  className?: string
  error?: string
}
