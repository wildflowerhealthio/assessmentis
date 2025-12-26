export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

export function formatDateTime(epochMillis: number | undefined): string {
  if (!epochMillis) return 'Unknown'
  try {
    return new Date(epochMillis).toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

export function formatGender(gender: string | undefined): string {
  if (!gender) return 'Unknown'
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}
