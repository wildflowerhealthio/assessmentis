import type { Location } from '@assessmentis/clinical-domain/administration'

export function getLocationDisplayName(location: Location): string {
  const name = location.name?.trim()
  if (name) return name

  const identifierValue = location.identifier?.[0]?.value?.trim()
  if (identifierValue) return identifierValue

  return `Location ${location.id}`
}
