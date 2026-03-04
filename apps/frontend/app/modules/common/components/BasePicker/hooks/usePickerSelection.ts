import { useCallback, useMemo } from 'react'

import type { PickerItem } from '../types/PickerTypes'

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

export function usePickerSelection<T>(
  items: ReadonlyArray<PickerItem<T>>,
  props: PickerSelectionProps
): {
  selectedItems: PickerItem<T>[]
  handleSelect: (item: PickerItem<T>) => void
  handleSelectMany: (item: ReadonlyArray<PickerItem<T>>) => void
  isSelected: (item: PickerItem<T>) => boolean
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
    return items.filter((item) => normalizedValue.includes(item.url.toString()))
  }, [items, normalizedValue])

  const handleSelect = useCallback(
    (item: PickerItem<T>) => {
      if (props.multiple) {
        const isCurrentlySelected = normalizedValue.includes(
          item.url.toString()
        )

        const newIds = isCurrentlySelected
          ? normalizedValue.filter((id) => id !== item.url.toString())
          : [...normalizedValue, item.url.toString()]

        props.onChange(newIds)
      } else {
        if (normalizedValue[0] === item.url.toString()) {
          // Deselect if already selected
          props.onChange(undefined)
          return
        } else {
          props.onChange(item.url.toString())
        }
      }
    },
    [props, normalizedValue]
  )

  const handleSelectMany = useCallback(
    (items: ReadonlyArray<PickerItem<T>>) => {
      if (props.multiple) {
        props.onChange(items.map((i) => i.url.toString()))
      }
    },
    [props]
  )

  const isSelected = useCallback(
    (item: PickerItem<T>) => {
      return normalizedValue.includes(item.url.toString())
    },
    [normalizedValue]
  )

  return { selectedItems, handleSelect, handleSelectMany, isSelected }
}
