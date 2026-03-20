import { Equal } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { wellFormedUrlArb } from '../readonly-url.arbitrary'
import type { Condition } from './condition'
import { AnyOf, Exactly, is, match } from './condition'
import { conditionValueArb } from './condition.arbitrary'

describe('SearchCondition', () => {
  describe('Exactly', () => {
    test('property: match round-trips the value', () => {
      fc.assert(
        fc.property(conditionValueArb, (v) => {
          const result = match(Exactly(v), {
            Exactly: ({ value }) => value,
            AnyOf: () => undefined,
          })
          expect(Equal.equals(result, v)).toBe(true)
        })
      )
    })

    test('property: structural equality holds for equal values', () => {
      fc.assert(
        fc.property(conditionValueArb, (v) => {
          expect(Equal.equals(Exactly(v), Exactly(v))).toBe(true)
        })
      )
    })

    test('property: is("Exactly") is always true, is("AnyOf") is always false', () => {
      fc.assert(
        fc.property(conditionValueArb, (v) => {
          expect(is('Exactly')(Exactly(v))).toBe(true)
          expect(is('AnyOf')(Exactly(v))).toBe(false)
        })
      )
    })

    test('property: works with ReadonlyUrl values', () => {
      fc.assert(
        fc.property(wellFormedUrlArb, (url) => {
          const condition = Exactly(url)
          const result = match(condition, {
            Exactly: ({ value }) => value,
            AnyOf: () => undefined,
          })
          expect(Equal.equals(result, url)).toBe(true)
        })
      )
    })
  })

  describe('AnyOf', () => {
    const anyOfValuesArb = fc
      .array(conditionValueArb, { minLength: 2, maxLength: 5 })
      .map((vs) => vs as [unknown, unknown, ...unknown[]])

    test('property: match round-trips the values', () => {
      fc.assert(
        fc.property(anyOfValuesArb, (vs) => {
          const result = match(AnyOf(vs), {
            Exactly: () => undefined,
            AnyOf: ({ values }) => values,
          })
          expect(result).toEqual(vs)
        })
      )
    })

    test('property: is("AnyOf") is always true, is("Exactly") is always false', () => {
      fc.assert(
        fc.property(anyOfValuesArb, (vs) => {
          const condition: Condition<unknown> = AnyOf(vs)
          expect(is('AnyOf')(condition)).toBe(true)
          expect(is('Exactly')(condition)).toBe(false)
        })
      )
    })
  })

  describe('match', () => {
    test('property: exhaustive match always returns a value', () => {
      fc.assert(
        fc.property(conditionValueArb, fc.boolean(), (v, useExactly) => {
          const condition = useExactly ? Exactly(v) : AnyOf([v, v])
          const result = match(condition, {
            Exactly: ({ value }) => `exact:${String(value)}`,
            AnyOf: ({ values }) => `any:${values.length}`,
          })
          expect(typeof result).toBe('string')
        })
      )
    })
  })
})
