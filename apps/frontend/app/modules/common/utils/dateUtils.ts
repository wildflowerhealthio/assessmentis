/**
 * Centralized date formatting utilities
 * Provides consistent, user-friendly date formatting across the application
 * 
 * This module respects timezone semantics:
 * - DateTime.Utc: For global times that matter to the application/server (e.g., last-updated timestamps)
 * - DateTime.Zoned: For local times meaningful in the user's space (e.g., appointment times)
 * - Date (string): For timezone-independent dates (e.g., birthdays)
 */

import { DateTime } from 'effect'

/**
 * Get ordinal suffix for a day (st, nd, rd, th)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

/**
 * Check if a date is within 3 months of today
 */
function isWithinThreeMonths(date: Date): boolean {
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)
  const threeMonthsFromNow = new Date(now)
  threeMonthsFromNow.setMonth(now.getMonth() + 3)
  return date >= threeMonthsAgo && date <= threeMonthsFromNow
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format a timezone-independent date (e.g., birthdays, anniversaries)
 * @param date - Date string (YYYY-MM-DD format)
 * @param fallback - Fallback string if date is undefined or invalid
 * @returns Formatted date string (e.g., "January 15th" or "January 15th, 2024")
 */
export function formatTimelessDate(
  date: string | Date | undefined,
  fallback: string = 'Unknown'
): string {
  if (!date) return fallback
  
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  if (isNaN(dateObj.getTime())) return fallback

  const month = dateObj.toLocaleString('en-US', { month: 'long' })
  const day = dateObj.getDate()
  const year = dateObj.getFullYear()
  const withinThreeMonths = isWithinThreeMonths(dateObj)

  if (withinThreeMonths) {
    return `${month} ${day}${getDaySuffix(day)}`
  }
  return `${month} ${day}${getDaySuffix(day)}, ${year}`
}

/**
 * Format a UTC timestamp (for server/application times like last-updated)
 * @param utc - DateTime.Utc timestamp
 * @param fallback - Fallback string if timestamp is undefined
 * @returns Formatted date and time string
 */
export function formatUtcDateTime(
  utc: DateTime.Utc | undefined,
  fallback: string = 'Unknown'
): string {
  if (!utc) return fallback
  const date = DateTime.toDateUtc(utc)
  return date.toLocaleString()
}

/**
 * Format a UTC timestamp as just a date (for server/application dates)
 * @param utc - DateTime.Utc timestamp
 * @param fallback - Fallback string if timestamp is undefined
 * @returns Formatted date string with user-friendly formatting
 */
export function formatUtcDate(
  utc: DateTime.Utc | undefined,
  fallback: string = 'Unknown'
): string {
  if (!utc) return fallback
  const date = DateTime.toDateUtc(utc)
  
  const month = date.toLocaleString('en-US', { month: 'long' })
  const day = date.getDate()
  const year = date.getFullYear()
  const withinThreeMonths = isWithinThreeMonths(date)

  if (withinThreeMonths) {
    return `${month} ${day}${getDaySuffix(day)}`
  }
  return `${month} ${day}${getDaySuffix(day)}, ${year}`
}

/**
 * Format a zoned datetime (for user-space times like appointments)
 * @param zoned - DateTime.Zoned timestamp
 * @param fallback - Fallback string if timestamp is undefined
 * @returns Formatted date and time string
 */
export function formatZonedDateTime(
  zoned: DateTime.Zoned | undefined,
  fallback: string = 'Unknown'
): string {
  if (!zoned) return fallback
  const date = DateTime.toDateAdjusted(zoned)
  return date.toLocaleString()
}

/**
 * Format options for date range formatting
 */
export interface DateRangeFormatOptions {
  /** Fallback when start is missing */
  startFallback?: string
  /** Fallback when end is missing */
  endFallback?: string
  /** Fallback when both start and end are missing */
  neitherFallback?: string
}

/**
 * Format a UTC date range with smart formatting
 * Shows date once when on the same day, omits year for recent dates
 * @param start - Start DateTime.Utc
 * @param end - End DateTime.Utc
 * @param options - Format options
 * @returns Formatted range (e.g., "December 31st 9 AM - 10 AM", "January 10 - 14th")
 */
export function formatUtcDateRange(
  start: DateTime.Utc | undefined,
  end: DateTime.Utc | undefined,
  options: DateRangeFormatOptions = {}
): string {
  const {
    startFallback = 'Unknown',
    endFallback = 'Present',
    neitherFallback = 'Unknown Range',
  } = options

  if (!start && !end) return neitherFallback
  if (!start) return `${startFallback} - ${formatUtcDate(end, endFallback)}`
  if (!end) return `${formatUtcDate(start, startFallback)} - ${endFallback}`

  const startDate = DateTime.toDateUtc(start)
  const endDate = DateTime.toDateUtc(end)

  // Same day: "December 31st 9 AM - 10 AM"
  if (isSameDay(startDate, endDate)) {
    const month = startDate.toLocaleString('en-US', { month: 'long' })
    const day = startDate.getDate()
    const startTime = startDate.toLocaleString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    })
    const endTime = endDate.toLocaleString('en-US', { 
      hour: 'numeric', 
      hour12: true 
    })
    return `${month} ${day}${getDaySuffix(day)} ${startTime} - ${endTime}`
  }

  // Same month and year: "January 10 - 14th"
  if (startDate.getMonth() === endDate.getMonth() && 
      startDate.getFullYear() === endDate.getFullYear()) {
    const month = startDate.toLocaleString('en-US', { month: 'long' })
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()
    const withinThreeMonths = isWithinThreeMonths(startDate)
    
    if (withinThreeMonths) {
      return `${month} ${startDay} - ${endDay}${getDaySuffix(endDay)}`
    }
    const year = startDate.getFullYear()
    return `${month} ${startDay} - ${endDay}${getDaySuffix(endDay)}, ${year}`
  }

  // Different months/years: show both dates
  return `${formatUtcDate(start)} - ${formatUtcDate(end)}`
}

/**
 * Format a UTC datetime range with smart formatting
 * @param start - Start DateTime.Utc
 * @param end - End DateTime.Utc
 * @param options - Format options
 * @returns Formatted datetime range
 */
export function formatUtcDateTimeRange(
  start: DateTime.Utc | undefined,
  end: DateTime.Utc | undefined,
  options: DateRangeFormatOptions = {}
): string {
  const {
    startFallback = 'Not specified',
    endFallback = 'Ongoing',
    neitherFallback = 'Unknown Range',
  } = options

  if (!start && !end) return neitherFallback
  if (!start) return `${startFallback} - ${formatUtcDateTime(end, endFallback)}`
  if (!end) return `${formatUtcDateTime(start, startFallback)} - ${endFallback}`

  const startDate = DateTime.toDateUtc(start)
  const endDate = DateTime.toDateUtc(end)

  // Same day: "December 31st 9:00 AM - 10:30 AM"
  if (isSameDay(startDate, endDate)) {
    const month = startDate.toLocaleString('en-US', { month: 'long' })
    const day = startDate.getDate()
    const startTime = startDate.toLocaleString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
    const endTime = endDate.toLocaleString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
    return `${month} ${day}${getDaySuffix(day)} ${startTime} - ${endTime}`
  }

  // Different days: show full datetime for both
  return `${formatUtcDateTime(start)} - ${formatUtcDateTime(end)}`
}

/**
 * Format a zoned datetime range with smart formatting
 * @param start - Start DateTime.Zoned
 * @param end - End DateTime.Zoned
 * @param options - Format options
 * @returns Formatted datetime range
 */
export function formatZonedDateTimeRange(
  start: DateTime.Zoned | undefined,
  end: DateTime.Zoned | undefined,
  options: DateRangeFormatOptions = {}
): string {
  const {
    startFallback = 'Not specified',
    endFallback = 'Ongoing',
    neitherFallback = 'Unknown Range',
  } = options

  if (!start && !end) return neitherFallback
  if (!start) return `${startFallback} - ${formatZonedDateTime(end, endFallback)}`
  if (!end) return `${formatZonedDateTime(start, startFallback)} - ${endFallback}`

  const startDate = DateTime.toDateAdjusted(start)
  const endDate = DateTime.toDateAdjusted(end)

  // Same day: "December 31st 9:00 AM - 10:30 AM"
  if (isSameDay(startDate, endDate)) {
    const month = startDate.toLocaleString('en-US', { month: 'long' })
    const day = startDate.getDate()
    const startTime = startDate.toLocaleString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
    const endTime = endDate.toLocaleString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
    return `${month} ${day}${getDaySuffix(day)} ${startTime} - ${endTime}`
  }

  // Different days: show full datetime for both
  return `${formatZonedDateTime(start)} - ${formatZonedDateTime(end)}`
}

// Legacy compatibility functions (deprecated - use timezone-specific functions)

/**
 * @deprecated Use formatUtcDate or formatTimelessDate instead
 */
export function formatDate(
  date: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  fallback: string = 'Unknown'
): string {
  if (!date) return fallback
  
  // Handle DateTime.Utc
  if (typeof date === 'object' && 'pipe' in date) {
    return formatUtcDate(date as DateTime.Utc, fallback)
  }
  
  // Handle epochMillis object
  if (typeof date === 'object' && 'epochMillis' in date) {
    const d = new Date(date.epochMillis)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleDateString()
  }
  
  // Handle Date object
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return fallback
    return date.toLocaleDateString()
  }
  
  // Handle number (epoch millis)
  if (typeof date === 'number') {
    const d = new Date(date)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleDateString()
  }
  
  // Handle string
  if (typeof date === 'string') {
    const d = new Date(date)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleDateString()
  }
  
  return fallback
}

/**
 * @deprecated Use formatUtcDateTime instead
 */
export function formatDateTime(
  date: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  fallback: string = 'Unknown'
): string {
  if (!date) return fallback
  
  // Handle DateTime.Utc
  if (typeof date === 'object' && 'pipe' in date) {
    return formatUtcDateTime(date as DateTime.Utc, fallback)
  }
  
  // Handle epochMillis object
  if (typeof date === 'object' && 'epochMillis' in date) {
    const d = new Date(date.epochMillis)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleString()
  }
  
  // Handle Date object
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return fallback
    return date.toLocaleString()
  }
  
  // Handle number (epoch millis)
  if (typeof date === 'number') {
    const d = new Date(date)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleString()
  }
  
  // Handle string
  if (typeof date === 'string') {
    const d = new Date(date)
    if (isNaN(d.getTime())) return fallback
    return d.toLocaleString()
  }
  
  return fallback
}

/**
 * @deprecated Use formatUtcDateRange instead
 */
export function formatDateRange(
  start: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  end?: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  endFallback: string = 'Present',
  startFallback: string = 'Unknown'
): string {
  const startStr = formatDate(start, startFallback)
  const endStr = end !== undefined ? formatDate(end, endFallback) : endFallback
  return `${startStr} - ${endStr}`
}

/**
 * @deprecated Use formatUtcDateTimeRange instead
 */
export function formatDateTimeRange(
  start: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  end?: Date | string | number | { epochMillis: number } | DateTime.Utc | undefined,
  endFallback: string = 'Ongoing',
  startFallback: string = 'Not specified'
): string {
  const startStr = formatDateTime(start, startFallback)
  const endStr = end !== undefined ? formatDateTime(end, endFallback) : endFallback
  return `${startStr} - ${endStr}`
}
