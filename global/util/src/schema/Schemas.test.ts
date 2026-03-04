import { describe, expect, it } from 'vitest'
import { DateTime, Schema } from 'effect'

import {
  DateTimeUtcFromFirebaseTimestamp,
  TimelessDateFromString,
} from './Schemas'

describe('TimelessDateFromString', () => {
  describe('decode', () => {
    it('should successfully decode a valid YYYY-MM-DD date string', () => {
      const result = Schema.decodeUnknownSync(TimelessDateFromString)(
        '2025-12-29'
      )

      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString().substring(0, 10)).toBe('2025-12-29')
    })

    it('should fail to decode an invalid date string (not YYYY-MM-DD format)', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)('29/12/2025')
      }).toThrow(/Expected a string matching the pattern/)
    })

    it('should fail to decode a date-time string with non-midnight time', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)(
          '2025-12-29T14:30:00.000Z'
        )
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
      const date = new Date(2025, 11, 29, 0, 0, 0, 0) // Month is 0-indexed
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

describe('DateTimeUtcFromFirebaseTimestamp', () => {
  const decode = Schema.decodeUnknownSync(DateTimeUtcFromFirebaseTimestamp)
  const encode = Schema.encodeSync(DateTimeUtcFromFirebaseTimestamp)

  describe('decode', () => {
    it('should decode a Firebase Timestamp to DateTime.Utc', () => {
      const result = decode({ seconds: 1700000000, nanoseconds: 0 })
      expect(DateTime.toEpochMillis(result)).toBe(1700000000000)
    })

    it('should decode nanoseconds into millisecond precision', () => {
      const result = decode({ seconds: 1700000000, nanoseconds: 123000000 })
      expect(DateTime.toEpochMillis(result)).toBe(1700000000123)
    })

    it('should decode zero timestamp', () => {
      const result = decode({ seconds: 0, nanoseconds: 0 })
      expect(DateTime.toEpochMillis(result)).toBe(0)
    })

    it('should truncate sub-millisecond nanoseconds', () => {
      const result = decode({ seconds: 1700000000, nanoseconds: 123456789 })
      expect(DateTime.toEpochMillis(result)).toBe(1700000000123)
    })
  })

  describe('encode', () => {
    it('should encode a DateTime.Utc to a Firebase Timestamp', () => {
      const dt = DateTime.unsafeMake(1700000000000)
      const result = encode(dt)
      expect(result).toEqual({ seconds: 1700000000, nanoseconds: 0 })
    })

    it('should encode milliseconds into nanoseconds', () => {
      const dt = DateTime.unsafeMake(1700000000123)
      const result = encode(dt)
      expect(result).toEqual({ seconds: 1700000000, nanoseconds: 123000000 })
    })

    it('should encode zero timestamp', () => {
      const dt = DateTime.unsafeMake(0)
      const result = encode(dt)
      expect(result).toEqual({ seconds: 0, nanoseconds: 0 })
    })
  })

  describe('roundtrip', () => {
    it('should roundtrip decode then encode', () => {
      const input = { seconds: 1700000000, nanoseconds: 456000000 }
      const dt = decode(input)
      const output = encode(dt)
      expect(output).toEqual(input)
    })

    it('should roundtrip encode then decode', () => {
      const dt = DateTime.unsafeMake(1700000000789)
      const encoded = encode(dt)
      const decoded = decode(encoded)
      expect(DateTime.toEpochMillis(decoded)).toBe(DateTime.toEpochMillis(dt))
    })
  })
})
