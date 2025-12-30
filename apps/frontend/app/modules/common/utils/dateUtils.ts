/**
 * Centralized date formatting utilities
 * Provides consistent, user-friendly date formatting across the application
 * 
 * This module respects timezone semantics:
 * - DateTime.Utc: For global times that matter to the application/server (e.g., last-updated timestamps)
 *   These are ALWAYS displayed in the user's local timezone
 * - DateTime.Zoned: For local times meaningful in the user's space (e.g., appointment times)
 *   These show their timezone if it differs from local time
 * - Date (string): For timezone-independent dates (e.g., birthdays)
 */

import { DateTime } from 'effect'
import type { Period } from '@assessmentis/clinical-domain/data-types'

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
 * @param date - Date object or undefined
 * @param fallback - Fallback string if date is undefined or invalid
 * @returns Formatted date string (e.g., "January 15th" or "January 15th, 2024")
 */
export function formatTimelessDate(
  date: Date | undefined,
  fallback: string = 'Unknown'
): string {
  if (!date) return fallback
  
  if (isNaN(date.getTime())) return fallback

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
 * Format a DateTime (Utc or Zoned) as a date
 * UTC dates are displayed in local time
 * Zoned dates show timezone if different from local
 * @param dateTime - DateTime.Utc or DateTime.Zoned
 * @param fallback - Fallback string if undefined
 * @returns Formatted date string with user-friendly formatting
 */
export function formatDateTime(
  dateTime: DateTime.Utc | DateTime.Zoned | undefined,
  fallback: string = 'Unknown'
): string {
  if (dateTime === undefined) return fallback
  
  // Convert to local Date for display
  const date = DateTime.isZoned(dateTime) 
    ? DateTime.toDateAdjusted(dateTime)
    : DateTime.toDateUtc(dateTime)
  
  const month = date.toLocaleString('en-US', { month: 'long' })
  const day = date.getDate()
  const year = date.getFullYear()
  const withinThreeMonths = isWithinThreeMonths(date)

  const dateStr = withinThreeMonths
    ? `${month} ${day}${getDaySuffix(day)}`
    : `${month} ${day}${getDaySuffix(day)}, ${year}`

  // For Zoned datetime, show timezone if different from local
  if (DateTime.isZoned(dateTime)) {
    const zoneName = DateTime.zonedGetZone(dateTime)
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zoneName !== localZone) {
      return `${dateStr} (${zoneName})`
    }
  }

  return dateStr
}

/**
 * Format a DateTime (Utc or Zoned) with time
 * UTC datetimes are displayed in local time
 * Zoned datetimes show timezone if different from local
 * @param dateTime - DateTime.Utc or DateTime.Zoned
 * @param fallback - Fallback string if undefined
 * @returns Formatted date and time string
 */
export function formatDateTimeWithTime(
  dateTime: DateTime.Utc | DateTime.Zoned | undefined,
  fallback: string = 'Unknown'
): string {
  if (dateTime === undefined) return fallback
  
  // Convert to local Date for display
  const date = DateTime.isZoned(dateTime) 
    ? DateTime.toDateAdjusted(dateTime)
    : DateTime.toDateUtc(dateTime)

  // For Zoned datetime, show timezone if different from local
  if (DateTime.isZoned(dateTime)) {
    const zoneName = DateTime.zonedGetZone(dateTime)
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zoneName !== localZone) {
      return date.toLocaleString('en-US', { timeZone: zoneName, timeZoneName: 'short' })
    }
  }

  return date.toLocaleString()
}

/**
 * Format a Period (date range) with smart formatting
 * Shows date once when on the same day, omits year for recent dates
 * @param period - Period with optional start and end DateTime.Utc
 * @param options - Format options
 * @returns Formatted range (e.g., "December 31st 9 AM - 10 AM", "January 10 - 14th")
 */
export function formatDateRange(
  period: Period | undefined,
  options: DateRangeFormatOptions = {}
): string {
  const {
    startFallback = 'Unknown',
    endFallback = 'Present',
    neitherFallback = 'Unknown Range',
  } = options

  if (!period) return neitherFallback
  
  const { start, end } = period

  if (!start && !end) return neitherFallback
  if (!start) return `${startFallback} - ${formatDateTime(end, endFallback)}`
  if (!end) return `${formatDateTime(start, startFallback)} - ${endFallback}`

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
  return `${formatDateTime(start)} - ${formatDateTime(end)}`
}

/**
 * Format a Period (datetime range) with smart formatting
 * @param period - Period with optional start and end DateTime.Utc
 * @param options - Format options
 * @returns Formatted datetime range
 */
export function formatDateTimeRange(
  period: Period | undefined,
  options: DateRangeFormatOptions = {}
): string {
  const {
    startFallback = 'Not specified',
    endFallback = 'Ongoing',
    neitherFallback = 'Unknown Range',
  } = options

  if (!period) return neitherFallback
  
  const { start, end } = period

  if (!start && !end) return neitherFallback
  if (!start) return `${startFallback} - ${formatDateTimeWithTime(end, endFallback)}`
  if (!end) return `${formatDateTimeWithTime(start, startFallback)} - ${endFallback}`

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
  return `${formatDateTimeWithTime(start)} - ${formatDateTimeWithTime(end)}`
}
