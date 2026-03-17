import { useMemo } from 'react'

import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'
import { defaultFilter } from './filterHelpers'

export function usePickerFilter<T extends PickerItemInstance>(
  items: ReadonlyArray<T>,
  searchQuery: string,
  filterFn?: (item: T, query: string) => boolean
): ReadonlyArray<T> {
  return useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }

    const filter = filterFn ?? defaultFilter
    return items.filter((item) => filter(item, searchQuery))
  }, [items, searchQuery, filterFn])
}
