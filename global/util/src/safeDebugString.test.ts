import { describe, expect, it } from 'vitest'

import { safeDebugString } from './safeDebugString'

describe('safeDebugString', () => {
  describe('primitive values', () => {
    it.each([
      { input: undefined, expected: 'undefined' },
      { input: null, expected: 'null' },
      { input: 42, expected: '42' },
      { input: 'hello', expected: '"hello"' },
      { input: true, expected: 'true' },
    ])('renders $expected for $input', ({ input, expected }) => {
      expect(safeDebugString(input)).toBe(expected)
    })
  })

  describe('special types', () => {
    it('renders named functions', () => {
      function myFunc() {}
      expect(safeDebugString(myFunc)).toBe('[Function: myFunc]')
    })

    it('renders anonymous functions', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(safeDebugString(() => {})).toBe('[Function: anonymous]')
    })

    it('renders symbols', () => {
      expect(safeDebugString(Symbol('test'))).toBe('Symbol(test)')
    })

    it('renders BigInt values', () => {
      expect(safeDebugString(BigInt(42))).toBe('<BigInt: 42n>')
    })
  })

  describe('objects and arrays', () => {
    it('formats objects with indentation', () => {
      expect(safeDebugString({ a: 1 })).toBe('{\n  "a": 1\n}')
    })

    it('formats arrays', () => {
      expect(safeDebugString([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]')
    })

    it('handles nested BigInt values inside objects', () => {
      const result = safeDebugString({ val: BigInt(99) })
      expect(result).toContain('<BigInt: 99n>')
    })
  })

  describe('circular references', () => {
    it('replaces circular references with [Circular]', () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj
      const result = safeDebugString(obj)
      expect(result).toContain('[Circular]')
      expect(result).not.toContain('TypeError')
    })

    it('handles deeply nested circular references', () => {
      const a: Record<string, unknown> = {}
      const b: Record<string, unknown> = { a }
      a.b = b
      const result = safeDebugString(a)
      expect(result).toContain('[Circular]')
    })
  })

  describe('truncation', () => {
    it('truncates output exceeding maxLength', () => {
      const large = { data: 'x'.repeat(3000) }
      const result = safeDebugString(large, { maxLength: 100 })
      expect(result.length).toBeLessThanOrEqual(100 + '... [truncated]'.length)
      expect(result).toContain('... [truncated]')
    })

    it('does not truncate output within maxLength', () => {
      const small = { a: 1 }
      const result = safeDebugString(small, { maxLength: 2000 })
      expect(result).not.toContain('[truncated]')
    })
  })

  describe('custom indent', () => {
    it('respects custom indent option', () => {
      const result = safeDebugString({ a: 1 }, { indent: 4 })
      expect(result).toBe('{\n    "a": 1\n}')
    })
  })
})
