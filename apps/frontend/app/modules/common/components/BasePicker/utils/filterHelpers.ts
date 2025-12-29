import { PickerItem } from '../types/PickerTypes'

export function defaultFilter<T>(item: PickerItem<T>, query: string): boolean {
  const lowerQuery = query.toLowerCase()

  const matchesDisplayName = item.displayName.toLowerCase().includes(lowerQuery)
  const matchesSecondaryText =
    item.secondaryText?.toLowerCase().includes(lowerQuery) ?? false

  return matchesDisplayName || matchesSecondaryText
}
