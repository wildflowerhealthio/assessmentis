import { useCallback, useMemo } from 'react'

import type { PickerItemInstance } from '../../../traits/Picker/picker-item'

export interface SinglePickerProps {
  multiple: false
  value: string | undefined
  onChange: (value?: string) => void
}

export interface MultiPickerProps {
  multiple: true
  value: readonly string[] | undefined
  onChange: (value?: readonly string[]) => void
}

export type PickerSelectionProps = MultiPickerProps | SinglePickerProps

export function usePickerSelection<T extends PickerItemInstance>(
  items: readonly T[],
  props: PickerSelectionProps
): {
  selectedItems: T[]
  handleSelect: (item: T) => void
  handleSelectMany: (item: readonly T[]) => void
  isSelected: (item: T) => boolean
} {
  const { value } = props
  // Normalize value to array internally
  const pickedIds: readonly string[] = useMemo(() => {
    if (typeof value === 'string') {
      return [value] as readonly string[]
    } else if (Array.isArray(value)) {
      return value as readonly string[]
    }
    return [] as readonly string[]
  }, [value])

  const selectedItems = useMemo(
    () => items.filter((item) => pickedIds.includes(item.PickerItem.id)),
    [items, pickedIds]
  )

  const handleSelect = useCallback(
    ({ PickerItem: { id } }: T) => {
      if (props.multiple) {
        const isCurrentlySelected = pickedIds.includes(id)

        let newIds: readonly string[]
        if (isCurrentlySelected) {
          newIds = pickedIds.filter((v) => v !== id)
        } else {
          newIds = [...pickedIds, id]
        }

        props.onChange(newIds)
      } else if (pickedIds[0] === id) {
        // Deselect if already selected
        props.onChange()
      } else {
        props.onChange(id)
      }
    },
    [props, pickedIds]
  )

  const handleSelectMany = useCallback(
    (newItems: readonly T[]) => {
      if (props.multiple) {
        props.onChange(newItems.map((i) => i.PickerItem.id))
      }
    },
    [props]
  )

  const isSelected = useCallback((item: T) => pickedIds.includes(item.PickerItem.id), [pickedIds])

  return { handleSelect, handleSelectMany, isSelected, selectedItems }
}
