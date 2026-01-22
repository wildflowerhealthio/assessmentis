import { describe, it, expect } from 'vitest'
import { buildSearchParams } from './HttpFunctions'

describe('HttpFunctions', () => {
  describe('buildSearchParams', () => {
    it('should build URLSearchParams with all defined values', () => {
      const params = {
        name: 'John',
        age: '30',
        city: 'NYC',
      }

      const result = buildSearchParams(params)

      expect(result.get('name')).toBe('John')
      expect(result.get('age')).toBe('30')
      expect(result.get('city')).toBe('NYC')
    })

    it('should filter out undefined values', () => {
      const params = {
        name: 'John',
        age: undefined,
        city: 'NYC',
        country: undefined,
      }

      const result = buildSearchParams(params)

      expect(result.get('name')).toBe('John')
      expect(result.get('age')).toBeNull()
      expect(result.get('city')).toBe('NYC')
      expect(result.get('country')).toBeNull()
    })

    it('should handle empty object', () => {
      const params = {}

      const result = buildSearchParams(params)

      expect(result.toString()).toBe('')
    })

    it('should handle all undefined values', () => {
      const params = {
        a: undefined,
        b: undefined,
      }

      const result = buildSearchParams(params)

      expect(result.toString()).toBe('')
    })
  })
})
