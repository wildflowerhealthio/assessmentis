import type { PickerItemInstance } from '../../../traits/Picker/PickerItem'

export function defaultFilter<T extends PickerItemInstance>(
  { PickerItem: { display, secondary } }: T,
  query: string
): boolean {
  const lowerQuery = query.toLowerCase()

  if (display.toLowerCase().includes(lowerQuery)) return true
  if (secondary == undefined) return false

  return secondary.toLowerCase().includes(lowerQuery)
}
