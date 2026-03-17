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
  const pickedIds: ReadonlyArray<string> = useMemo(() => {
    if (typeof value === 'string') {
      return [value] as ReadonlyArray<string>
    } else if (Array.isArray(value)) {
      return value as ReadonlyArray<string>
    }
    return [] as ReadonlyArray<string>
  }, [value])

  const selectedItems = useMemo(() => {
    return items.filter((item) => pickedIds.includes(item.PickerItem.id))
  }, [items, pickedIds])

  const handleSelect = useCallback(
    ({ PickerItem: { id } }: T) => {
      if (props.multiple) {
        const isCurrentlySelected = pickedIds.includes(id)

        const newIds = isCurrentlySelected
          ? pickedIds.filter((v) => v !== id)
          : [...pickedIds, id]

        props.onChange(newIds)
      } else {
        if (pickedIds[0] === id) {
          // Deselect if already selected
          props.onChange(undefined)
          return
        } else {
          props.onChange(id)
        }
      }
    },
    [props, pickedIds]
  )

  const handleSelectMany = useCallback(
    (items: ReadonlyArray<T>) => {
      if (props.multiple) {
        props.onChange(items.map((i) => i.PickerItem.id))
      }
    },
    [props]
  )

  const isSelected = useCallback(
    (item: T) => {
      return pickedIds.includes(item.PickerItem.id)
    },
    [pickedIds]
  )

  return { selectedItems, handleSelect, handleSelectMany, isSelected }
}
