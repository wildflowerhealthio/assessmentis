import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import {
  ensureIsDocumentData,
  setStrictDocumentValidation,
} from './DocumentStore'

describe('ensureIsDocumentData', () => {
  test('returns a plain object for valid input', () => {
    const input = { name: 'Alice', age: 30 }
    const result = ensureIsDocumentData(input)
    expect(result).toEqual({ name: 'Alice', age: 30 })
  })

  test('returns empty object for empty input', () => {
    const result = ensureIsDocumentData({})
    expect(result).toEqual({})
  })

  test('copies entries into a fresh object', () => {
    const input = { a: 1 }
    const result = ensureIsDocumentData(input)
    expect(result).not.toBe(input)
    expect(result).toEqual({ a: 1 })
  })

  test('class instances become a fresh object', () => {
    class Foo {
      value = 1

      method() {
        return 'method'
      }
    }
    const input = new Foo()
    const result = ensureIsDocumentData(input)
    expect(result).not.toBe(input)
    expect(result).toEqual({ value: 1 })
    expect(result).not.toHaveProperty('method')
  })

  describe('development mode', () => {
    beforeEach(() => {
      setStrictDocumentValidation(true)
    })
    afterEach(() => {
      setStrictDocumentValidation(false) // Clean up after each test
    })

    test('throws TypeError for null', () => {
      expect(() => ensureIsDocumentData(null)).toThrow(TypeError)
      expect(() => ensureIsDocumentData(null)).toThrow('null')
    })

    test('throws TypeError for undefined', () => {
      expect(() => ensureIsDocumentData(undefined)).toThrow(TypeError)
    })

    test('throws TypeError for arrays', () => {
      expect(() => ensureIsDocumentData([1, 2, 3])).toThrow(TypeError)
      expect(() => ensureIsDocumentData([1, 2, 3])).toThrow('an array')
    })

    test('throws TypeError for primitives', () => {
      expect(() => ensureIsDocumentData(42)).toThrow(TypeError)
      expect(() => ensureIsDocumentData('hello')).toThrow(TypeError)
      expect(() => ensureIsDocumentData(true)).toThrow(TypeError)
    })
  })
})
