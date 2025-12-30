import { describe, it, expect } from 'vitest'
import { DateTime } from 'effect'
import {
  formatTimelessDate,
  formatUtcDate,
  formatUtcDateTime,
  formatUtcDateRange,
  formatUtcDateTimeRange,
} from './dateUtils'

describe('dateUtils', () => {
  describe('formatTimelessDate', () => {
    it('should format a date string with ordinal suffix', () => {
      const result = formatTimelessDate('2024-01-15')
      expect(result).toContain('January')
      expect(result).toContain('15')
      expect(result).toContain('th')
    })

    it('should format a Date object', () => {
      const date = new Date('2024-01-01T00:00:00')
      const result = formatTimelessDate(date)
      expect(result).toContain('January')
      expect(result).toContain('1')
      expect(result).toContain('st')
    })

    it('should omit year for dates within 3 months', () => {
      const now = new Date()
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(now.getMonth() - 1)
      const dateStr = oneMonthAgo.toISOString().split('T')[0]
      
      const result = formatTimelessDate(dateStr)
      // Should not contain year for recent dates
      const currentYear = now.getFullYear()
      expect(result).not.toContain(currentYear.toString())
    })

    it('should include year for dates beyond 3 months', () => {
      const result = formatTimelessDate('2020-01-15')
      expect(result).toContain('2020')
    })

    it('should return fallback for undefined', () => {
      expect(formatTimelessDate(undefined)).toBe('Unknown')
    })

    it('should return custom fallback', () => {
      expect(formatTimelessDate(undefined, 'N/A')).toBe('N/A')
    })
  })

  describe('formatUtcDate', () => {
    it('should format a UTC timestamp', () => {
      const utc = DateTime.unsafeMakeZoned('2024-01-15T12:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDate(DateTime.removeTimeZone(utc))
      expect(result).toContain('January')
      expect(result).toContain('15')
    })

    it('should return fallback for undefined', () => {
      expect(formatUtcDate(undefined)).toBe('Unknown')
    })
  })

  describe('formatUtcDateTime', () => {
    it('should format a UTC timestamp with time', () => {
      const utc = DateTime.unsafeMakeZoned('2024-01-15T12:30:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateTime(DateTime.removeTimeZone(utc))
      // Should contain date components
      expect(result.length).toBeGreaterThan(10)
    })

    it('should return fallback for undefined', () => {
      expect(formatUtcDateTime(undefined)).toBe('Unknown')
    })
  })

  describe('formatUtcDateRange', () => {
    it('should format a date range with both dates', () => {
      const start = DateTime.unsafeMakeZoned('2021-01-01T00:00:00Z', {
        timeZone: 'UTC',
      })
      const end = DateTime.unsafeMakeZoned('2022-01-01T00:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateRange(
        DateTime.removeTimeZone(start),
        DateTime.removeTimeZone(end)
      )
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
    })

    it('should use "Present" when end is undefined', () => {
      const start = DateTime.unsafeMakeZoned('2021-01-01T00:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateRange(DateTime.removeTimeZone(start), undefined)
      expect(result).toContain('2021')
      expect(result).toContain('Present')
    })

    it('should use custom fallbacks from options', () => {
      const result = formatUtcDateRange(undefined, undefined, {
        neitherFallback: 'No dates',
        startFallback: 'Start unknown',
        endFallback: 'End unknown',
      })
      expect(result).toBe('No dates')
    })

    it('should format same-day range smartly', () => {
      const start = DateTime.unsafeMakeZoned('2024-01-15T09:00:00Z', {
        timeZone: 'UTC',
      })
      const end = DateTime.unsafeMakeZoned('2024-01-15T10:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateRange(
        DateTime.removeTimeZone(start),
        DateTime.removeTimeZone(end)
      )
      // Should show date once: "January 15th 9 AM - 10 AM"
      expect(result).toContain('January')
      expect(result).toContain('15')
      expect(result).toContain('AM')
    })

    it('should format same-month range smartly', () => {
      const start = DateTime.unsafeMakeZoned('2024-01-10T00:00:00Z', {
        timeZone: 'UTC',
      })
      const end = DateTime.unsafeMakeZoned('2024-01-14T00:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateRange(
        DateTime.removeTimeZone(start),
        DateTime.removeTimeZone(end)
      )
      // Should show: "January 10 - 14th" (if within 3 months)
      expect(result).toContain('January')
      expect(result).toContain('10')
      expect(result).toContain('14')
    })
  })

  describe('formatUtcDateTimeRange', () => {
    it('should format datetime range with both dates', () => {
      const start = DateTime.unsafeMakeZoned('2021-01-01T09:00:00Z', {
        timeZone: 'UTC',
      })
      const end = DateTime.unsafeMakeZoned('2022-01-01T17:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateTimeRange(
        DateTime.removeTimeZone(start),
        DateTime.removeTimeZone(end)
      )
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
    })

    it('should use "Ongoing" when end is undefined', () => {
      const start = DateTime.unsafeMakeZoned('2021-01-01T09:00:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateTimeRange(
        DateTime.removeTimeZone(start),
        undefined
      )
      expect(result).toContain('2021')
      expect(result).toContain('Ongoing')
    })

    it('should format same-day datetime range smartly', () => {
      const start = DateTime.unsafeMakeZoned('2024-01-15T09:00:00Z', {
        timeZone: 'UTC',
      })
      const end = DateTime.unsafeMakeZoned('2024-01-15T10:30:00Z', {
        timeZone: 'UTC',
      })
      const result = formatUtcDateTimeRange(
        DateTime.removeTimeZone(start),
        DateTime.removeTimeZone(end)
      )
      // Should show time with minutes: "January 15th 9:00 AM - 10:30 AM"
      expect(result).toContain('January')
      expect(result).toContain('15')
      expect(result).toContain(':')
    })

    it('should use custom fallbacks from options', () => {
      const result = formatUtcDateTimeRange(undefined, undefined, {
        neitherFallback: 'No times',
      })
      expect(result).toBe('No times')
    })
  })
})
