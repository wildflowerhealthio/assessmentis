import { useCallback, useMemo } from 'react'

import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'

export interface SinglePickerProps {
  multiple: false
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export interface MultiPickerProps {
  multiple: true
  value: ReadonlyArray<string> | undefined
  onChange: (value: ReadonlyArray<string> | undefined) => void
}

export type PickerSelectionProps = MultiPickerProps | SinglePickerProps

export function usePickerSelection<T extends PickerItemInstance>(
  items: ReadonlyArray<T>,
  props: PickerSelectionProps
): {
  selectedItems: T[]
  handleSelect: (item: T) => void
  handleSelectMany: (item: ReadonlyArray<T>) => void
  isSelected: (item: T) => boolean
} {
  const value = props.value
  // Normalize value to array internally
  const normalizedValue: ReadonlyArray<string> = useMemo(() => {
    if (typeof value === 'string') {
      return [value] as ReadonlyArray<string>
    } else if (Array.isArray(value)) {
      return value as ReadonlyArray<string>
    }
    return [] as ReadonlyArray<string>
  }, [value])

  const selectedItems = useMemo(() => {
    return items.filter((item) =>
      normalizedValue.includes(item.PickerItem.id.toString())
    )
  }, [items, normalizedValue])

  const handleSelect = useCallback(
    (item: T) => {
      if (props.multiple) {
        const isCurrentlySelected = normalizedValue.includes(
          item.PickerItem.id.toString()
        )

        const newIds = isCurrentlySelected
          ? normalizedValue.filter((id) => id !== item.PickerItem.id)
          : [...normalizedValue, item.PickerItem.id]

        props.onChange(newIds)
      } else {
        if (normalizedValue[0] === item.PickerItem.id) {
          // Deselect if already selected
          props.onChange(undefined)
          return
        } else {
          props.onChange(item.PickerItem.id)
        }
      }
    },
    [props, normalizedValue]
  )

  const handleSelectMany = useCallback(
    (items: ReadonlyArray<T>) => {
      if (props.multiple) {
        props.onChange(items.map((i) => i.PickerItem.id.toString()))
      }
    },
    [props]
  )

  const isSelected = useCallback(
    (item: T) => {
      return normalizedValue.includes(item.PickerItem.id.toString())
    },
    [normalizedValue]
  )

  return { selectedItems, handleSelect, handleSelectMany, isSelected }
}
