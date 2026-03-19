import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { TimelessDateFromString } from './timeless-date-from-string'

describe('TimelessDateFromString', () => {
  describe('decode', () => {
    it('should successfully decode a valid YYYY-MM-DD date string', () => {
      const result = Schema.decodeUnknownSync(TimelessDateFromString)('2025-12-29')

      expect(result).toBe('2025-12-29')
      expect(typeof result).toBe('string')
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

    it('should fail to decode a non-string value', () => {
      expect(() => {
        Schema.decodeUnknownSync(TimelessDateFromString)(12345)
      }).toThrow()
    })
  })

  describe('encode', () => {
    it('should successfully encode a branded TimelessDate string', () => {
      const decoded = Schema.decodeUnknownSync(TimelessDateFromString)('2025-12-29')
      const result = Schema.encodeSync(TimelessDateFromString)(decoded)

      expect(result).toBe('2025-12-29')
    })
  })
})
