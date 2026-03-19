import { useMemo } from 'react'

import type { PickerItemInstance } from '../../../traits/Picker/picker-item'
import { defaultFilter } from './filter-helpers'

export function usePickerFilter<T extends PickerItemInstance>(
  items: readonly T[],
  searchQuery: string,
  filterFn?: (item: T, query: string) => boolean
): readonly T[] {
  return useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }

    const filter = filterFn ?? defaultFilter
    return items.filter((item) => filter(item, searchQuery))
  }, [items, searchQuery, filterFn])
}
