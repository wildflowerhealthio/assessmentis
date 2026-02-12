import { describe, it, expect } from 'vitest'
import { buildSearchParams, flattenSearchParams } from './HttpFunctions'

describe('HttpFunctions', () => {
  describe('flattenSearchParams', () => {
    it('should pass through string values', () => {
      expect(flattenSearchParams({ name: 'John', age: '30' })).toEqual({
        name: 'John',
        age: '30',
      })
    })

    it('should join array values with commas', () => {
      expect(flattenSearchParams({ status: ['active', 'inactive'] })).toEqual({
        status: 'active,inactive',
      })
    })

    it('should omit undefined values', () => {
      expect(flattenSearchParams({ a: 'x', b: undefined })).toEqual({
        a: 'x',
      })
    })

    it('should omit empty arrays', () => {
      expect(flattenSearchParams({ a: [], b: 'x' })).toEqual({ b: 'x' })
    })

    it('should handle single-element arrays', () => {
      expect(flattenSearchParams({ id: ['abc'] })).toEqual({ id: 'abc' })
    })
  })

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

    it('should join array values with commas', () => {
      const result = buildSearchParams({
        encounter: ['Encounter/1', 'Encounter/2'],
        status: 'active',
      })

      expect(result.get('encounter')).toBe('Encounter/1,Encounter/2')
      expect(result.get('status')).toBe('active')
    })

    it('should omit empty arrays', () => {
      const result = buildSearchParams({
        encounter: [] as string[],
        status: 'active',
      })

      expect(result.get('encounter')).toBeNull()
      expect(result.get('status')).toBe('active')
    })
  })
})
