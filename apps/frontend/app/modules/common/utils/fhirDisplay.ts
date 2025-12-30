import type { HumanName } from '@assessmentis/clinical-domain/data-types'

// Re-export reference utilities from clinical-domain
export {
  extractReferenceId,
  extractReferenceIds,
} from '@assessmentis/clinical-domain/data-types'

/**
 * Format a FHIR HumanName into a display string
 * @param name - The FHIR HumanName to format
 * @param fallback - The fallback string if name is undefined or empty
 * @returns Formatted name string (e.g., "John Doe")
 */
export function formatHumanName(
  name: HumanName | undefined,
  fallback: string = 'Unnamed'
): string {
  if (!name) return fallback

  const given = name.given?.join(' ').trim() ?? ''
  const family = name.family?.trim() ?? ''

  const fullName = `${given} ${family}`.trim()
  return fullName || fallback
}

/**
 * Capitalize the first letter of a string
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 */
export function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Format a date string for display, with validation
 * @param date - ISO date string or undefined
 * @returns Formatted date or fallback string
 */
export function formatDate(
  date: Date | undefined,
  fallback: string = 'Unknown'
): string {
  if (!date) return fallback
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString()
}

/**
 * Format a date from epoch milliseconds for display
 * @param epochMillis - Epoch milliseconds or undefined
 * @returns Formatted date or fallback string
 */
export function formatDateTime(
  epochMillis: number | undefined,
  fallback: string = 'Unknown'
): string {
  if (!epochMillis) return fallback
  const date = new Date(epochMillis)
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString()
}

/**
 * Format gender with proper capitalization
 * @param gender - Gender string (e.g., "male", "female")
 * @returns Capitalized gender or fallback
 */
export function formatGender(
  gender: string | undefined,
  fallback: string = 'Unknown'
): string {
  if (!gender) return fallback
  return capitalizeFirst(gender)
}
