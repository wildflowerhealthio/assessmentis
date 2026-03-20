/**
 * Centralized date formatting utilities
 * Provides consistent, user-friendly date formatting across the application
 *
 * This module respects timezone semantics:
 * - DateTime.Utc: For global times that matter to the application/server (e.g., last-updated timestamps)
 *   These are ALWAYS displayed in the user's local timezone
 * - DateTime.Zoned: For local times meaningful in the user's space (e.g., appointment times)
 *   These show their timezone if it differs from local time
 * - TimelessDate (branded YYYY-MM-DD string): For timezone-independent dates (e.g., birthdays)
 *
 * All functions that depend on the current time return Effects to enable:
 * - Testability (inject a test Clock with fixed time)
 * - Explicit dependency on time (no hidden global state)
 */

import { DateTime, Duration, Effect } from 'effect'

import type { Period } from '@assessmentis/clinical-domain/data-types'

/**
 * Get ordinal suffix for a day (st, nd, rd, th)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1: {
      return 'st'
    }
    case 2: {
      return 'nd'
    }
    case 3: {
      return 'rd'
    }
    default: {
      return 'th'
    }
  }
}

/**
 * Check if a date is within 3 months of a reference time
 * @param date - The date to check
 * @param now - The reference time (typically the current time from Clock)
 */
const needsDisambiguatingYear = (date: DateTime.DateTime): Effect.Effect<boolean> =>
  DateTime.now.pipe(
    Effect.map((now) => {
      const away = DateTime.distance(now, date)
      // 90 days is an arbitrary cutoff for "recent"
      // Return true if date is more than 90 days away (needs year to disambiguate)
      return Math.abs(away) >= Duration.days(90).pipe(Duration.toMillis)
    })
  )

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: DateTime.DateTime, date2: DateTime.DateTime): boolean {
  const parts1 = DateTime.toParts(date1)
  const parts2 = DateTime.toParts(date2)

  if (!parts1 || !parts2) {
    return false
  }
  return parts1.year === parts2.year && parts1.month === parts2.month && parts1.day === parts2.day
}

/**
 * Format a timezone-independent date (e.g., birthdays, anniversaries)
 * Uses Clock to determine if the year should be included based on proximity to current date
 * @param dateString - YYYY-MM-DD date string or undefined
 * @param fallback - Fallback string if date is undefined or invalid
 * @returns Effect that produces formatted date string (e.g., "January 15th" or "January 15th, 2024")
 */
export const humanizeTimelessDate = (
  dateString: string | undefined,
  fallback: string = 'Unknown'
): Effect.Effect<string, never, DateTime.CurrentTimeZone> =>
  Effect.gen(function* () {
    if (dateString === undefined) {
      return fallback
    }

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return fallback
    }

    let dateTime: DateTime.DateTime
    try {
      dateTime = DateTime.unsafeFromDate(date)
    } catch {
      return fallback
    }

    const showYear = yield* needsDisambiguatingYear(dateTime)
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
      // oxlint-disable-next-line eslint/no-ternary -- inline option in Intl config object
      year: showYear ? 'numeric' : undefined,
    })
  })

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
 * Uses Clock to determine if year should be included
 * @param dateTime - DateTime.Utc or DateTime.Zoned
 * @param fallback - Fallback string if undefined
 * @returns Effect that produces formatted date string with user-friendly formatting
 */
export const humanizeDateTimeForLocalReader = (
  dateTime: DateTime.Utc | DateTime.Zoned | undefined,
  fallback: string = 'Unknown'
): Effect.Effect<string, never, DateTime.CurrentTimeZone> =>
  Effect.gen(function* () {
    if (dateTime === undefined) {
      return fallback
    }

    const needsYear = yield* needsDisambiguatingYear(dateTime)
    const currentTz = yield* DateTime.CurrentTimeZone
    let timeZone: string | undefined
    if (currentTz._tag === 'Named') {
      timeZone = currentTz.id
    }

    let dateStyle: 'medium' | 'long' = 'long'
    if (needsYear) {
      dateStyle = 'medium'
    }

    if (DateTime.isUtc(dateTime)) {
      // UTC just gets localized
      return DateTime.formatLocal(dateTime, {
        dateStyle,
        timeZone,
      })
    }

    if (dateTime.zone === DateTime.zoneMakeLocal()) {
      // Local Zoned just shows date
      return DateTime.formatLocal(dateTime, {
        dateStyle,
        timeZone,
      })
    }

    return DateTime.formatLocal(dateTime, {
      dateStyle,
      timeZone,
      timeZoneName: 'short',
    })
  })

/**
 * Format a DateTime (Utc or Zoned) with time
 * UTC datetimes are displayed in local time
 * Zoned datetimes show timezone if different from local
 * Uses Clock to determine if year should be included
 * @param dateTime - DateTime.Utc or DateTime.Zoned
 * @param fallback - Fallback string if undefined
 * @returns Effect that produces formatted date and time string
 */
export const humanizeDateTimeWithTime = (
  dateTime: DateTime.Utc | DateTime.Zoned | undefined,
  fallback: string = 'Unknown'
): Effect.Effect<string, never, DateTime.CurrentTimeZone> =>
  Effect.gen(function* () {
    if (dateTime === undefined) {
      return fallback
    }

    const needsYear = yield* needsDisambiguatingYear(dateTime)

    const currentTz = yield* DateTime.CurrentTimeZone
    let timeZone: string | undefined
    if (currentTz._tag === 'Named') {
      timeZone = currentTz.id
    }
    const baseFormat: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      hour: 'numeric',
      hour12: true,
      minute: '2-digit',
      month: 'short',
      timeZone,
      // oxlint-disable-next-line eslint/no-ternary -- inline option in Intl config object
      year: needsYear ? 'numeric' : undefined,
    }

    if (DateTime.isUtc(dateTime)) {
      // UTC just gets localized
      return DateTime.formatLocal(dateTime, {
        ...baseFormat,
      })
    }

    const sourceOffset = DateTime.zonedOffset(dateTime)
    const dateTimeAsLocal = yield* DateTime.setZoneCurrent(dateTime)
    const localEquivalentOffset = DateTime.zonedOffset(dateTimeAsLocal)
    if (sourceOffset === localEquivalentOffset) {
      // Local Zoned just shows date
      return DateTime.formatLocal(dateTime, {
        ...baseFormat,
      })
    }

    return DateTime.formatLocal(dateTime, {
      ...baseFormat,
      timeZoneName: 'short',
    })
  })
/**
 * Format a Period (date range) with smart formatting
 * Shows date once when on the same day, omits year for recent dates
 * Uses Clock to determine if year should be included
 * @param period - Period with optional start and end DateTime.Utc
 * @param options - Format options
 * @returns Effect that produces formatted range (e.g., "December 31st 9 AM - 10 AM", "January 10 - 14th")
 */
export const humanizeDateRange = (
  period: Period | undefined,
  options: DateRangeFormatOptions = {}
): Effect.Effect<string, never, DateTime.CurrentTimeZone> =>
  Effect.gen(function* () {
    const {
      startFallback = 'Unknown',
      endFallback = 'Present',
      neitherFallback = 'Unknown Range',
    } = options

    if (!period) {
      return neitherFallback
    }

    const { start, end } = period

    if (!start && !end) {
      return neitherFallback
    }
    if (!start) {
      const endFormatted = yield* humanizeDateTimeForLocalReader(end, endFallback)
      return `${startFallback} - ${endFormatted}`
    }
    if (!end) {
      const startFormatted = yield* humanizeDateTimeForLocalReader(start, startFallback)
      return `${startFormatted} - ${endFallback}`
    }

    const currentTz = yield* DateTime.CurrentTimeZone
    let timeZone: string | undefined
    if (currentTz._tag === 'Named') {
      timeZone = currentTz.id
    }

    // Same day: "December 31st 9 AM - 10 AM"
    if (isSameDay(start, end)) {
      const month = DateTime.formatLocal(start, { month: 'long' })
      const day = DateTime.getPart(start, 'day')
      const startTime = DateTime.formatLocal(start, {
        hour: 'numeric',
        hour12: true,
        timeZone,
      })
      const endTime = DateTime.formatLocal(end, {
        hour: 'numeric',
        hour12: true,
        timeZone,
      })
      return `${month} ${day}${getDaySuffix(day)} ${startTime} - ${endTime}`
    }

    // Same month and year: "January 10 - 14th"
    if (
      start.partsUtc?.month === end.partsUtc?.month &&
      start.partsUtc?.year === end.partsUtc?.year
    ) {
      const month = DateTime.formatLocal(start, { month: 'short' })
      const startDay = DateTime.getPart(start, 'day')
      const endDay = DateTime.getPart(end, 'day')
      const withinThreeMonths = yield* needsDisambiguatingYear(start)

      if (withinThreeMonths) {
        return `${month} ${startDay} - ${endDay}${getDaySuffix(endDay)}`
      }
      const year = DateTime.getPart(start, 'year')
      return `${month} ${startDay} - ${endDay}${getDaySuffix(endDay)}, ${year}`
    }

    // Different months/years: show both dates
    const startFormatted = yield* humanizeDateTimeForLocalReader(start)
    const endFormatted = yield* humanizeDateTimeForLocalReader(end)
    return `${startFormatted} - ${endFormatted}`
  })

/**
 * Format a Period (datetime range) with smart formatting
 * Uses Clock to determine if year should be included
 * @param period - Period with optional start and end DateTime.Utc
 * @param options - Format options
 * @returns Effect that produces formatted datetime range
 */
export const humanizeDateTimeRangeForLocalReader = (
  period: Period | undefined,
  options: DateRangeFormatOptions = {}
): Effect.Effect<string, never, DateTime.CurrentTimeZone> =>
  Effect.gen(function* () {
    const {
      startFallback = 'Not specified',
      endFallback = 'Ongoing',
      neitherFallback = 'Unknown Range',
    } = options

    if (!period) {
      return neitherFallback
    }

    const { start, end } = period
    if (!start && !end) {
      return neitherFallback
    }

    const currentTz = yield* DateTime.CurrentTimeZone
    let timeZone: string | undefined
    if (currentTz._tag === 'Named') {
      timeZone = currentTz.id
    }

    if (!start) {
      const endFormatted = yield* humanizeDateTimeWithTime(end, endFallback)
      return `${startFallback} - ${endFormatted}`
    }
    if (!end) {
      const startFormatted = yield* humanizeDateTimeWithTime(start, startFallback)
      return `${startFormatted} - ${endFallback}`
    }

    // Same day: "December 31st 9:00 AM - 10:30 AM"
    if (isSameDay(start, end)) {
      const month = DateTime.formatLocal(start, { month: 'short' })
      const day = DateTime.getPart(start, 'day')
      const startTime = DateTime.formatLocal(start, {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
        timeZone,
      })
      const endTime = DateTime.formatLocal(end, {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
        timeZone,
      })
      return `${month} ${day}${getDaySuffix(day)} ${startTime} - ${endTime}`
    }

    // Different days: show full datetime for both
    const startFormatted = yield* humanizeDateTimeWithTime(start)
    const endFormatted = yield* humanizeDateTimeWithTime(end)
    return `${startFormatted} - ${endFormatted}`
  })
