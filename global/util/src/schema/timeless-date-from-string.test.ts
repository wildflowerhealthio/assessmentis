import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { TimelessDateFromString } from './timeless-date-from-string'

describe('TimelessDateFromString', () => {
  describe('decode', () => {
    it('should successfully decode a valid YYYY-MM-DD date string', () => {
      const result = Schema.decodeUnknownSync(TimelessDateFromString)('2025-12-29')

      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString().slice(0, 10)).toBe('2025-12-29')
    })

    it('should fail to decode an invalid date string (not YYYY-MM-DD format)', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)('29/12/2025')
      }).toThrow(/Expected a string matching the pattern/)
    })

    it('should fail to decode a date-time string with non-midnight time', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)('2025-12-29T14:30:00.000Z')
      }).toThrow(/Expected a string matching the pattern/)
    })

    it('should fail to decode an invalid date string', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)('2025-13-45')
      }).toThrow(/String must be a valid date/)
    })
  })

  describe('encode', () => {
    it('should successfully encode a Date with midnight time (UTC)', () => {
      const date = new Date('2025-12-29T00:00:00.000Z')
      const result = Schema.encodeSync(TimelessDateFromString)(date)

      expect(result).toBe('2025-12-29')
    })

    it('should successfully encode a Date with midnight time (local)', () => {
      // Create a date at local midnight
      // Month is 0-indexed
      const date = new Date(2025, 11, 29, 0, 0, 0, 0)
      const result = Schema.encodeSync(TimelessDateFromString)(date)

      expect(result).toBe('2025-12-29')
    })

    it('should fail to encode a Date with non-midnight time', () => {
      const date = new Date('2025-12-29T14:30:00.000Z')

      expect(() => {
        Schema.encodeSync(TimelessDateFromString)(date)
      }).toThrow(/Date must have time component of 00:00:00.000/)
    })

    it('should fail to encode a Date with partial midnight time (non-zero milliseconds)', () => {
      const date = new Date('2025-12-29T00:00:00.123Z')

      expect(() => {
        Schema.encodeSync(TimelessDateFromString)(date)
      }).toThrow(/Date must have time component of 00:00:00.000/)
    })
  })
})
