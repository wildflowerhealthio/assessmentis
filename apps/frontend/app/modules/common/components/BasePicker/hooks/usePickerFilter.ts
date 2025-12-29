import { useMemo } from 'react'
import { PickerItem } from '../types/PickerTypes'
import { defaultFilter } from '../utils/filterHelpers'

export function usePickerFilter<T>(
  items: ReadonlyArray<PickerItem<T>>,
  searchQuery: string,
  filterFn?: (item: PickerItem<T>, query: string) => boolean
): ReadonlyArray<PickerItem<T>> {
  return useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return items
    }

    const filter = filterFn ?? defaultFilter
    return items.filter((item) => filter(item, searchQuery))
  }, [items, searchQuery, filterFn])
}
