import { DateTime, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { DateTimeUtcFromFirebaseTimestamp } from './firebase-timestamp'

describe('DateTimeUtcFromFirebaseTimestamp', () => {
  const decode = Schema.decodeUnknownSync(DateTimeUtcFromFirebaseTimestamp)
  const encode = Schema.encodeSync(DateTimeUtcFromFirebaseTimestamp)

  describe('decode', () => {
    it('should decode a Firebase Timestamp to DateTime.Utc', () => {
      const result = decode({ nanoseconds: 0, seconds: 1700000000 })
      expect(DateTime.toEpochMillis(result)).toBe(1_700_000_000_000)
    })

    it('should decode nanoseconds into millisecond precision', () => {
      const result = decode({ nanoseconds: 123000000, seconds: 1700000000 })
      expect(DateTime.toEpochMillis(result)).toBe(1_700_000_000_123)
    })

    it('should decode zero timestamp', () => {
      const result = decode({ nanoseconds: 0, seconds: 0 })
      expect(DateTime.toEpochMillis(result)).toBe(0)
    })

    it('should truncate sub-millisecond nanoseconds', () => {
      const result = decode({ nanoseconds: 123456789, seconds: 1700000000 })
      expect(DateTime.toEpochMillis(result)).toBe(1_700_000_000_123)
    })
  })

  describe('encode', () => {
    it('should encode a DateTime.Utc to a Firebase Timestamp', () => {
      const dt = DateTime.unsafeMake(1_700_000_000_000)
      const result = encode(dt)
      expect(result).toEqual({ nanoseconds: 0, seconds: 1700000000 })
    })

    it('should encode milliseconds into nanoseconds', () => {
      const dt = DateTime.unsafeMake(1_700_000_000_123)
      const result = encode(dt)
      expect(result).toEqual({ nanoseconds: 123000000, seconds: 1700000000 })
    })

    it('should encode zero timestamp', () => {
      const dt = DateTime.unsafeMake(0)
      const result = encode(dt)
      expect(result).toEqual({ nanoseconds: 0, seconds: 0 })
    })

    it('should encode negative timestamps just below an integer', () => {
      const dt = DateTime.unsafeMake(-1)
      const result = encode(dt)
      expect(result).toEqual({ nanoseconds: 999_000_000, seconds: -1 })
    })

    it('should encode negative timestamps just above an integer', () => {
      const dt = DateTime.unsafeMake(-999)
      const result = encode(dt)
      expect(result).toEqual({ nanoseconds: 1_000_000, seconds: -1 })
    })
  })

  describe('roundtrip', () => {
    it('should roundtrip decode then encode', () => {
      const input = { nanoseconds: 456000000, seconds: 1700000000 }
      const dt = decode(input)
      const output = encode(dt)
      expect(output).toEqual(input)
    })

    it('should roundtrip encode then decode', () => {
      const dt = DateTime.unsafeMake(1_700_000_000_789)
      const encoded = encode(dt)
      const decoded = decode(encoded)
      expect(DateTime.toEpochMillis(decoded)).toBe(DateTime.toEpochMillis(dt))
    })
  })
})
