import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import type { PickerSelectionProps } from '../hooks/usePickerSelection'

export interface PickerItem<T> {
  url: ReadonlyUrl
  displayName: string
  secondaryText?: string
  metadata?: undefined | T
}

export interface CommonPickerProps<T> {
  picking: PickerSelectionProps

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
}

export interface BasePickerProps<T> extends CommonPickerProps<T> {
  items: ReadonlyArray<PickerItem<T>>
  loading?: boolean
  error?: string
}

export interface PromisedPickerProps<T> extends CommonPickerProps<T> {
  itemsPromise: Promise<ReadonlyArray<PickerItem<T>>>
}
