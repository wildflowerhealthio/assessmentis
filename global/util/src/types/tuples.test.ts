import { Predicate } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { tupleFilter, tupleIndexMap } from './tuples'
import type { TupleFilter, TupleIndexMap } from './tuples'

describe('tupleFilter', () => {
  test('property: result contains only elements matching the predicate', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean())), (arr) => {
        const result = tupleFilter(arr as readonly unknown[], Predicate.isString)
        for (const item of result) {
          expect(typeof item).toBe('string')
        }
      })
    )
  })

  test('property: result preserves order of matching elements', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.integer())), (arr) => {
        const result = tupleFilter(arr as readonly unknown[], Predicate.isString)
        const expected = arr.filter((x) => Predicate.isString(x))
        expect(result).toEqual(expected)
      })
    )
  })

  test('property: result length <= input length', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.string(), fc.integer())), (arr) => {
        const result = tupleFilter(arr as readonly unknown[], Predicate.isString)
        expect(result.length).toBeLessThanOrEqual(arr.length)
      })
    )
  })

  test('returns empty for no matches', () => {
    const result = tupleFilter([1, 2, 3] as const, Predicate.isString)
    expect(result).toEqual([])
  })

  test('returns all for all matches', () => {
    const result = tupleFilter(['a', 'b', 'c'] as const, Predicate.isString)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  test('type: filters tuple type to matching members', () => {
    type Input = readonly ['a', 1, 'b', true, 'c']
    type Result = TupleFilter<Input, string>
    expectTypeOf<Result>().toEqualTypeOf<['a', 'b', 'c']>()
  })

  test('type: empty result when no members match', () => {
    type Input = readonly [1, 2, 3]
    type Result = TupleFilter<Input, string>
    expectTypeOf<Result>().toEqualTypeOf<[]>()
  })

  test('type: preserves all when every member matches', () => {
    type Input = readonly ['a', 'b', 'c']
    type Result = TupleFilter<Input, string>
    expectTypeOf<Result>().toEqualTypeOf<['a', 'b', 'c']>()
  })
})

describe('tupleIndexMap', () => {
  test('property: output[i] === mapping[input[i]]', () => {
    const mapping = { a: 1, b: 2, c: 3 } as const

    fc.assert(
      fc.property(fc.array(fc.constantFrom('a' as const, 'b' as const, 'c' as const)), (keys) => {
        const result = tupleIndexMap(keys as readonly (keyof typeof mapping)[], mapping)
        for (let i = 0; i < keys.length; i++) {
          expect(result[i]).toBe(mapping[keys[i]])
        }
      })
    )
  })

  test('property: output length equals input length', () => {
    const mapping = { x: 10, y: 20 } as const

    fc.assert(
      fc.property(fc.array(fc.constantFrom('x' as const, 'y' as const)), (keys) => {
        const result = tupleIndexMap(keys as readonly (keyof typeof mapping)[], mapping)
        expect(result.length).toBe(keys.length)
      })
    )
  })

  test('maps empty tuple to empty result', () => {
    const mapping = { a: 1 } as const
    const result = tupleIndexMap([] as const, mapping)
    expect(result).toEqual([])
  })

  test('maps single-element tuple', () => {
    const mapping = { a: 'alpha', b: 'beta' } as const
    const result = tupleIndexMap(['b'] as const, mapping)
    expect(result).toEqual(['beta'])
  })

  test('type: maps tuple of keys to tuple of values', () => {
    type Keys = readonly ['a', 'b', 'c']
    interface Mapping {
      readonly a: 1
      readonly b: 2
      readonly c: 3
    }
    type Result = TupleIndexMap<Keys, Mapping>
    expectTypeOf<Result>().toEqualTypeOf<readonly [1, 2, 3]>()
  })

  test('type: empty tuple maps to empty', () => {
    type Keys = readonly []
    interface Mapping {
      readonly a: 1
    }
    type Result = TupleIndexMap<Keys, Mapping>
    expectTypeOf<Result>().toEqualTypeOf<readonly []>()
  })
})
