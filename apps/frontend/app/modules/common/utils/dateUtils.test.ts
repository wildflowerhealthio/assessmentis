import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDateRange,
  formatDateTimeRange,
} from './dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format a Date object', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const result = formatDate(date)
      // Should contain date components (year and day)
      expect(result).toContain('2024')
      expect(result).toMatch(/15/)
    })

    it('should format an ISO string', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('2024')
      expect(result).toMatch(/15/)
    })

    it('should format epoch milliseconds', () => {
      const epochMillis = new Date('2024-01-15').getTime()
      const result = formatDate(epochMillis)
      expect(result).toContain('2024')
      expect(result).toMatch(/15/)
    })

    it('should format an object with epochMillis property', () => {
      const epochObj = { epochMillis: new Date('2024-01-15').getTime() }
      const result = formatDate(epochObj)
      expect(result).toContain('2024')
      expect(result).toMatch(/15/)
    })

    it('should return fallback for undefined', () => {
      expect(formatDate(undefined)).toBe('Unknown')
    })

    it('should return custom fallback', () => {
      expect(formatDate(undefined, 'N/A')).toBe('N/A')
    })

    it('should return fallback for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('Unknown')
    })

    it('should handle zero timestamp', () => {
      const result = formatDate(0)
      expect(result).toMatch(/1970/)
    })
  })

  describe('formatDateTime', () => {
    it('should format a Date object with time', () => {
      const date = new Date('2024-01-15T12:30:00Z')
      const result = formatDateTime(date)
      // Should include date components
      expect(result).toContain('2024')
      // Should be longer than just a date (includes time)
      expect(result.length).toBeGreaterThan(10)
    })

    it('should format epoch milliseconds with time', () => {
      const epochMillis = new Date('2024-01-15T12:30:00Z').getTime()
      const result = formatDateTime(epochMillis)
      expect(result).toContain('2024')
      expect(result.length).toBeGreaterThan(10)
    })

    it('should format an object with epochMillis property with time', () => {
      const epochObj = {
        epochMillis: new Date('2024-01-15T12:30:00Z').getTime(),
      }
      const result = formatDateTime(epochObj)
      expect(result).toContain('2024')
      expect(result.length).toBeGreaterThan(10)
    })

    it('should return fallback for undefined', () => {
      expect(formatDateTime(undefined)).toBe('Unknown')
    })

    it('should return custom fallback', () => {
      expect(formatDateTime(undefined, 'N/A')).toBe('N/A')
    })

    it('should return fallback for invalid date', () => {
      expect(formatDateTime('invalid-date')).toBe('Unknown')
    })
  })

  describe('formatDateRange', () => {
    it('should format a date range with both dates', () => {
      const start = new Date('2021-01-01')
      const end = new Date('2022-01-01')
      const result = formatDateRange(start, end)
      // Should contain both years and a separator
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
    })

    it('should handle epoch milliseconds for both dates', () => {
      const start = new Date('2021-01-01').getTime()
      const end = new Date('2022-01-01').getTime()
      const result = formatDateRange(start, end)
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
    })

    it('should handle objects with epochMillis property', () => {
      const start = { epochMillis: new Date('2021-01-01').getTime() }
      const end = { epochMillis: new Date('2022-01-01').getTime() }
      const result = formatDateRange(start, end)
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
    })

    it('should use "Present" when end date is undefined', () => {
      const start = new Date('2021-01-01')
      const result = formatDateRange(start, undefined)
      expect(result).toContain('2021')
      expect(result).toContain('Present')
    })

    it('should use "Present" when end parameter is omitted', () => {
      const start = new Date('2021-01-01')
      const result = formatDateRange(start)
      expect(result).toContain('2021')
      expect(result).toContain('Present')
    })

    it('should use "Unknown" when start date is undefined', () => {
      const end = new Date('2022-01-01')
      const result = formatDateRange(undefined, end)
      expect(result).toContain('Unknown')
      expect(result).toContain('2022')
    })

    it('should use custom fallbacks', () => {
      const result = formatDateRange(undefined, undefined, 'Now', 'N/A')
      expect(result).toBe('N/A - Now')
    })

    it('should handle mixed input types', () => {
      const start = new Date('2021-01-01').getTime()
      const end = { epochMillis: new Date('2022-01-01').getTime() }
      const result = formatDateRange(start, end)
      expect(result).toContain('2021')
      expect(result).toContain('2022')
    })
  })

  describe('formatDateTimeRange', () => {
    it('should format a date/time range with both dates', () => {
      const start = new Date('2021-01-01T09:00:00Z')
      const end = new Date('2022-01-01T17:00:00Z')
      const result = formatDateTimeRange(start, end)
      expect(result).toContain('2021')
      expect(result).toContain('2022')
      expect(result).toContain('-')
      expect(result.length).toBeGreaterThan(20) // Should include time components
    })

    it('should handle epoch milliseconds', () => {
      const start = new Date('2021-01-01T09:00:00Z').getTime()
      const end = new Date('2022-01-01T17:00:00Z').getTime()
      const result = formatDateTimeRange(start, end)
      expect(result).toContain('2021')
      expect(result).toContain('2022')
    })

    it('should use "Ongoing" when end date is undefined', () => {
      const start = new Date('2021-01-01T09:00:00Z')
      const result = formatDateTimeRange(start, undefined)
      expect(result).toContain('2021')
      expect(result).toContain('Ongoing')
    })

    it('should use "Not specified" when start date is undefined', () => {
      const end = new Date('2022-01-01T17:00:00Z')
      const result = formatDateTimeRange(undefined, end)
      expect(result).toContain('Not specified')
      expect(result).toContain('2022')
    })

    it('should use custom fallbacks', () => {
      const result = formatDateTimeRange(
        undefined,
        undefined,
        'Current',
        'Missing'
      )
      expect(result).toBe('Missing - Current')
    })
  })
})
