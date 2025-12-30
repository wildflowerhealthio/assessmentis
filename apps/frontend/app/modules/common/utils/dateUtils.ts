/**
 * Centralized date formatting utilities
 * Provides consistent date formatting across the application
 */

/**
 * Convert various date input types to a Date object
 * @param date - Date, ISO string, epoch milliseconds, or object with epochMillis
 * @returns Date object or undefined if input is invalid
 */
function toDate(
  date: Date | string | number | { epochMillis: number } | undefined
): Date | undefined {
  if (!date) return undefined

  if (date instanceof Date) {
    return date
  }

  if (typeof date === 'number') {
    return new Date(date)
  }

  if (typeof date === 'string') {
    return new Date(date)
  }

  if (typeof date === 'object' && 'epochMillis' in date) {
    return new Date(date.epochMillis)
  }

  return undefined
}

/**
 * Format a date for display
 * @param date - Date, ISO string, epoch milliseconds, or object with epochMillis
 * @param fallback - Fallback string if date is undefined or invalid
 * @returns Formatted date string (e.g., "1/15/2024")
 */
export function formatDate(
  date: Date | string | number | { epochMillis: number } | undefined,
  fallback: string = 'Unknown'
): string {
  const dateObj = toDate(date)
  if (!dateObj || isNaN(dateObj.getTime())) {
    return fallback
  }
  return dateObj.toLocaleDateString()
}

/**
 * Format a date and time for display
 * @param date - Date, ISO string, epoch milliseconds, or object with epochMillis
 * @param fallback - Fallback string if date is undefined or invalid
 * @returns Formatted date and time string (e.g., "1/15/2024, 3:30:00 PM")
 */
export function formatDateTime(
  date: Date | string | number | { epochMillis: number } | undefined,
  fallback: string = 'Unknown'
): string {
  const dateObj = toDate(date)
  if (!dateObj || isNaN(dateObj.getTime())) {
    return fallback
  }
  return dateObj.toLocaleString()
}

/**
 * Format a date range for display
 * @param start - Start date (Date, ISO string, epoch milliseconds, or object with epochMillis)
 * @param end - End date (Date, ISO string, epoch milliseconds, or object with epochMillis)
 * @param endFallback - Fallback string for end date if undefined (default: "Present")
 * @param startFallback - Fallback string for start date if undefined (default: "Unknown")
 * @returns Formatted date range string (e.g., "1/1/2021 - 1/1/2022" or "1/1/2021 - Present")
 */
export function formatDateRange(
  start: Date | string | number | { epochMillis: number } | undefined,
  end?: Date | string | number | { epochMillis: number } | undefined,
  endFallback: string = 'Present',
  startFallback: string = 'Unknown'
): string {
  const startStr = formatDate(start, startFallback)
  const endStr =
    end !== undefined ? formatDate(end, endFallback) : endFallback
  return `${startStr} - ${endStr}`
}

/**
 * Format a date range with times for display
 * @param start - Start date (Date, ISO string, epoch milliseconds, or object with epochMillis)
 * @param end - End date (Date, ISO string, epoch milliseconds, or object with epochMillis)
 * @param endFallback - Fallback string for end date if undefined (default: "Ongoing")
 * @param startFallback - Fallback string for start date if undefined (default: "Not specified")
 * @returns Formatted date/time range string (e.g., "1/1/2021, 9:00:00 AM - 1/1/2022, 5:00:00 PM")
 */
export function formatDateTimeRange(
  start: Date | string | number | { epochMillis: number } | undefined,
  end?: Date | string | number | { epochMillis: number } | undefined,
  endFallback: string = 'Ongoing',
  startFallback: string = 'Not specified'
): string {
  const startStr = formatDateTime(start, startFallback)
  const endStr =
    end !== undefined ? formatDateTime(end, endFallback) : endFallback
  return `${startStr} - ${endStr}`
}
