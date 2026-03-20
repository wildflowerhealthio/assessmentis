import { Equal } from 'effect'
import { describe, expect, it } from 'vitest'

import type { Condition } from './condition'
import { AnyOf, Exactly, is, match } from './condition'

describe('SearchCondition', () => {
  describe('Exactly', () => {
    it('creates a tagged value with _tag "Exactly"', () => {
      const condition = Exactly('hello')
      expect(condition._tag).toBe('Exactly')
      expect(condition.value).toBe('hello')
    })

    it('supports structural equality', () => {
      expect(Equal.equals(Exactly('a'), Exactly('a'))).toBe(true)
      expect(Equal.equals(Exactly('a'), Exactly('b'))).toBe(false)
    })
  })

  describe('AnyOf', () => {
    it('creates a tagged value with _tag "AnyOf"', () => {
      const condition = AnyOf(['x', 'y'])
      expect(condition._tag).toBe('AnyOf')
      expect(condition.values).toEqual(['x', 'y'])
    })

    it('accepts more than two values', () => {
      const condition = AnyOf(['a', 'b', 'c', 'd'])
      expect(condition.values).toEqual(['a', 'b', 'c', 'd'])
    })

    it('supports structural equality', () => {
      const values = ['a', 'b'] as const
      expect(Equal.equals(AnyOf(values), AnyOf(values))).toBe(true)
      expect(Equal.equals(AnyOf(['a', 'b'] as const), AnyOf(['b', 'a'] as const))).toBe(false)
    })
  })

  describe('match', () => {
    it('exhaustively matches Exactly', () => {
      const result = match(Exactly('test'), {
        Exactly: ({ value }) => `exact:${value}`,
        AnyOf: ({ values }) => `any:${values.join(',')}`,
      })
      expect(result).toBe('exact:test')
    })

    it('exhaustively matches AnyOf', () => {
      const result = match(AnyOf(['a', 'b']), {
        Exactly: ({ value }) => `exact:${value}`,
        AnyOf: ({ values }) => `any:${values.join(',')}`,
      })
      expect(result).toBe('any:a,b')
    })
  })

  describe('is', () => {
    it('narrows to Exactly', () => {
      const condition: Condition = Exactly('x')
      expect(is('Exactly')(condition)).toBe(true)
      expect(is('AnyOf')(condition)).toBe(false)
    })

    it('narrows to AnyOf', () => {
      const condition: Condition = AnyOf(['a', 'b'])
      expect(is('AnyOf')(condition)).toBe(true)
      expect(is('Exactly')(condition)).toBe(false)
    })
  })
})
