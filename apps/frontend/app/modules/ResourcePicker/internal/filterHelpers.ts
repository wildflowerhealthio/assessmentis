import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'

export function defaultFilter<T extends PickerItemInstance>(
  item: T,
  query: string
): boolean {
  const lowerQuery = query.toLowerCase()

  const matchesDisplayName = item.PickerItem.display
    .toLowerCase()
    .includes(lowerQuery)
  const matchesSecondaryText =
    item.PickerItem.secondary.toLowerCase().includes(lowerQuery) ?? false

  return matchesDisplayName || matchesSecondaryText
}
