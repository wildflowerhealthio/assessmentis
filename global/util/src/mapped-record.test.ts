// oxlint-disable unicorn/no-array-sort
import { FastCheck as fc } from 'effect'
import { assert, describe, expect, it, vi } from 'vitest'

import { MappedRecord } from '.'
import {
  apply,
  entriesOf,
  flatMap,
  fromEntries,
  groupBy,
  map,
  mapGeneric,
  zip,
} from './mapped-record'

// --- Types ---

type ABC = 'A' | 'B' | 'C'

// --- Arbitraries ---

type TaggedA = { readonly _tag: 'A'; readonly id: number }
type TaggedB = { readonly _tag: 'B'; readonly id: number }
type TaggedC = { readonly _tag: 'C'; readonly id: number }
type TaggedItem = TaggedA | TaggedB | TaggedC

const taggedItemArb: fc.Arbitrary<TaggedItem> = fc.record({
  _tag: fc.constantFrom('A' as const, 'B' as const, 'C' as const),
  id: fc.integer(),
})

/** MappedRecord with keys A, B, C holding number[] values */
const recordArb = fc
  .tuple(fc.array(fc.integer()), fc.array(fc.integer()), fc.array(fc.integer()))
  .map(([a, b, c]) => abcRecord(a, b, c))

// --- fromEntries ---

describe('fromEntries', () => {
  it('should create a record with the specified keys and values', () => {
    // Arrange & Act — { [K in N as `${K}`]: V[K] } pattern for type-safe entries
    const record = fromEntries<
      ABC[],
      { [K in 0 | 1 | 2 as ['A', 'B', 'C'][K]]: [1, 'hello', true][K] }
    >([
      ['A', 1],
      ['B', 'hello'],
      ['C', true],
    ] as const)

    // Assert
    expect(record.A).toBe(1)
    expect(record.B).toBe('hello')
    expect(record.C).toBe(true)
  })

  it('should produce a record iterable by entriesOf', () => {
    // Arrange
    const record = abcRecord(10, 'hello', true)

    // Act
    const entries = entriesOf(record)

    // Assert
    expect(entries).toHaveLength(3)
    expect(entries).toContainEqual(['A', 10])
    expect(entries).toContainEqual(['B', 'hello'])
    expect(entries).toContainEqual(['C', true])
  })

  it('should round-trip through entriesOf', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const entries = entriesOf(record)
        const reconstructed = fromEntries<ABC[], { [K in ABC]: number[] }>(
          entries //as [['A', number[]], ['B', number[]], ['C', number[]]]
        )

        // Assert
        for (const [key, value] of entries) {
          expect(reconstructed[key as ABC]).toEqual(value)
        }
      })
    )
  })
})

// --- groupBy ---

describe('groupBy', () => {
  it('should not lose or duplicate items', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')

        // Assert
        const totalInGroups = Object.values(grouped).reduce(
          (sum, group) => sum + (group?.length ?? 0),
          0
        )
        expect(totalInGroups).toBe(items.length)
      })
    )
  })

  it('should place each item in the group matching its key value', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')

        // Assert
        for (const [groupKey, groupItems] of Object.entries(grouped)) {
          if (!groupItems) continue
          for (const item of groupItems) {
            expect(item._tag).toBe(groupKey)
          }
        }
      })
    )
  })

  it('should keep every input item (by reference) in exactly one group', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')

        // Assert
        const allGrouped = Object.values(grouped).flat()
        for (const item of items) {
          const matches = allGrouped.filter((g) => g === item)
          expect(matches).toHaveLength(1)
        }
      })
    )
  })

  it('should preserve within-group order from the original array', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')

        // Assert
        for (const groupItems of Object.values(grouped)) {
          if (!groupItems || groupItems.length < 2) continue
          for (let i = 0; i < groupItems.length - 1; i++) {
            const idxA = items.indexOf(groupItems[i])
            const idxB = items.indexOf(groupItems[i + 1])
            expect(idxA).toBeLessThan(idxB)
          }
        }
      })
    )
  })

  it('should only contain keys that appear in the input', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')

        // Assert
        const inputKeys = new Set(items.map((item) => item._tag))
        for (const key of Object.keys(grouped)) {
          expect(inputKeys.has(key as ABC)).toBe(true)
        }
      })
    )
  })

  it('should produce an empty result for empty input', () => {
    // Act
    const grouped = groupBy([] as TaggedItem[], '_tag')

    // Assert
    expect(Object.keys(grouped)).toHaveLength(0)
  })
})

// --- entriesOf ---

describe('entriesOf', () => {
  it('should yield [key, value] pairs where record[key] === value', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act & Assert
        for (const [key, value] of entriesOf(record)) {
          expect(record[key as ABC]).toBe(value)
        }
      })
    )
  })

  it('should yield all keys exactly once', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const yieldedKeys = entriesOf(record)
          .map(([k]) => k)
          .sort()

        // Assert
        const recordKeys = Object.keys(record).sort()
        expect(yieldedKeys).toEqual(recordKeys)
      })
    )
  })

  it('should yield the same number of entries as Object.keys', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const entries = entriesOf(record)

        // Assert
        expect(entries).toHaveLength(Object.keys(record).length)
      })
    )
  })
})

// --- map ---
// map infers Keys correctly from MappedRecord, so no `as any` needed

describe('map', () => {
  it('should preserve the same keys as the input', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = map<readonly ABC[], typeof record, number[]>(record, (v: number[]) => v)

        // Assert
        expect(Object.keys(result).sort()).toEqual(Object.keys(record).sort())
      })
    )
  })

  it('should transform each value through f', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = map(record, (values) => (values as number[]).length)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          expect(result[key as ABC]).toBe(value.length)
        }
      })
    )
  })

  it('should call f exactly once per entry', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const f = vi.fn()

        // Act
        map(record, f)

        // Assert
        expect(f).toHaveBeenCalledTimes(Object.keys(record).length)
      })
    )
  })
})

// --- mapGeneric ---
// mapGeneric has a higher-rank callback — Keys inference is weaker here

describe('mapGeneric', () => {
  it('should preserve the same keys as the input', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = mapGeneric(record, (v: any) => v)

        // Assert
        expect(Object.keys(result).sort()).toEqual(Object.keys(record).sort())
      })
    )
  })

  it('should transform each value through f', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result: any = mapGeneric(record, (values: any) => values.length)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          expect(result[key]).toBe(value.length)
        }
      })
    )
  })

  it('should call f exactly once per entry', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const f = vi.fn((v: any) => v)

        // Act
        mapGeneric(record, f)

        // Assert
        expect(f).toHaveBeenCalledTimes(Object.keys(record).length)
      })
    )
  })
})

// --- flatMap ---
// flatMap/apply have multi-generic signatures that prevent Keys inference
// from outside the module (KeyList is private), so fns/spies need `as any`

describe('flatMap', () => {
  const fns: any = {
    A: (v: number[]) => v.length,
    B: (v: number[]) => v.reduce((a: number, b: number) => a + b, 0),
    C: (v: number[]) => v.map(String),
  }

  it('should preserve the same keys as the input', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = flatMap(record, fns)

        // Assert
        expect(Object.keys(result).sort()).toEqual(Object.keys(record).sort())
      })
    )
  })

  it('should transform each key with its own function', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result: any = flatMap(record, fns)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          if (key === 'A') {
            expect(result.A).toBe(value.length)
          } else if (key === 'B') {
            expect(result.B).toBe(value.reduce((a, b) => a + b, 0))
          } else if (key === 'C') {
            expect(result.C).toEqual(value.map(String))
          } else {
            assert.fail(`Unexpected key: ${String(key)}`)
          }
        }
      })
    )
  })

  it('should call each per-key function exactly once', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const spies: any = {
          A: vi.fn((v: number[]) => v.length),
          B: vi.fn((v: number[]) => v.length),
          C: vi.fn((v: number[]) => v.length),
        }

        // Act
        flatMap(record, spies)

        // Assert
        for (const key of ['A', 'B', 'C'] as const) {
          expect(spies[key]).toHaveBeenCalledTimes(1)
        }
      })
    )
  })

  it('should pass the correct value to each per-key function', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const spies: any = {
          A: vi.fn((v: number[]) => v),
          B: vi.fn((v: number[]) => v),
          C: vi.fn((v: number[]) => v),
        }

        // Act
        flatMap(record, spies)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          expect(spies[key]).toHaveBeenCalledWith(value)
        }
      })
    )
  })
})

// --- zip ---

describe('zip', () => {
  const keys = ['A', 'B', 'C'] as const

  const recordArbA = fc
    .tuple(fc.integer(), fc.string(), fc.boolean())
    .map(([a, b, c]) => abcRecord(a, b, c))

  const recordArbB = fc
    .tuple(fc.string(), fc.integer(), fc.array(fc.integer()))
    .map(([a, b, c]) => abcRecord(a, b, c))

  it('should produce a result with all provided keys', () => {
    fc.assert(
      fc.property(recordArbA, recordArbB, (a, b) => {
        // Act
        const result = zip(keys as any, a, b)

        // Assert
        expect(Object.keys(result).sort()).toEqual([...keys].sort())
      })
    )
  })

  it('should pair the correct values from both records in each tuple', () => {
    fc.assert(
      fc.property(recordArbA, recordArbB, (a, b) => {
        // Act
        const result: any = zip(keys as any, a, b)

        // Assert
        for (const key of keys) {
          expect(result[key][0]).toBe(a[key])
          expect(result[key][1]).toEqual(b[key])
        }
      })
    )
  })

  it('should produce an empty result when the keys array is empty', () => {
    // Arrange
    const a = abcRecord(1, 2, 3)
    const b = abcRecord('x', 'y', 'z')

    // Act
    const result = zip([] as any, a, b)

    // Assert
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('should swap tuple elements when argument order is reversed', () => {
    fc.assert(
      fc.property(recordArbA, recordArbB, (a, b) => {
        // Act
        const ab: any = zip(keys as any, a, b)
        const ba: any = zip(keys as any, b, a)

        // Assert
        expect(Object.keys(ab).sort()).toEqual(Object.keys(ba).sort())
        for (const key of keys) {
          expect(ab[key][0]).toBe(ba[key][1])
          expect(ab[key][1]).toEqual(ba[key][0])
        }
      })
    )
  })
})

// --- apply ---

describe('apply', () => {
  const fns = {
    A: (v: number[]) => v.length,
    B: (v: number[]) => v.reduce((a: number, b: number) => a + b, 0),
    C: (v: number[]) => v.map(String),
  } as const

  it('should preserve the same keys as the input', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = apply<readonly ABC[], typeof record, typeof fns>(record, fns)

        // Assert
        expect(Object.keys(result).sort()).toEqual(Object.keys(record).sort())
      })
    )
  })

  it('should place the original value as the first element of each tuple', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = apply<readonly ABC[], typeof record, typeof fns>(record, fns)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          expect(result[key][0]).toBe(value)
        }
      })
    )
  })

  it('should place fns[key](value) as the second element of each tuple', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Act
        const result = apply<readonly ABC[], typeof record, typeof fns>(record, fns)

        // Assert
        for (const [key, value] of entriesOf(record)) {
          if (key === 'A') {
            expect(result[key][1]).toBe(value.length)
          } else if (key === 'B') {
            expect(result[key][1]).toBe(value.reduce((a, b) => a + b, 0))
          } else if (key === 'C') {
            expect(result[key][1]).toEqual(value.map(String))
          } else {
            assert.fail(`Unexpected key: ${String(key)}`)
          }
        }
      })
    )
  })

  it('should be equivalent to zip(keys, record, flatMap(record, fns))', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const keys = Object.keys(record) as readonly ABC[]

        // Act
        const viaApply = apply<readonly ABC[], typeof record, typeof fns>(record, fns)
        const viaZipFlatMap: any = zip(
          keys,
          record,
          flatMap<
            readonly ABC[],
            typeof record,
            MappedRecord.MappedRecord<readonly ABC[], { [K in ABC]: ReturnType<(typeof fns)[K]> }>
          >(record, fns)
        )

        // Assert
        for (const key of keys) {
          expect(viaApply[key][0]).toBe(viaZipFlatMap[key][0])
          expect(viaApply[key][1]).toEqual(viaZipFlatMap[key][1])
        }
      })
    )
  })

  it('should call each per-key function exactly once', () => {
    fc.assert(
      fc.property(recordArb, (record) => {
        // Arrange
        const spies: any = {
          A: vi.fn((v: number[]) => v.length),
          B: vi.fn((v: number[]) => v.length),
          C: vi.fn((v: number[]) => v.length),
        }

        // Act
        apply(record, spies)

        // Assert
        for (const key of ['A', 'B', 'C'] as const) {
          expect(spies[key]).toHaveBeenCalledTimes(1)
        }
      })
    )
  })
})

// --- groupBy + entriesOf round-trip ---

describe('groupBy → entriesOf round-trip', () => {
  it('should visit every input item exactly once when iterating entriesOf(groupBy(items, key))', () => {
    fc.assert(
      fc.property(fc.array(taggedItemArb), (items) => {
        // Act
        const grouped = groupBy(items, '_tag')
        const visited: TaggedItem[] = []
        for (const [groupKey, groupItems] of entriesOf<readonly ABC[], typeof grouped>(grouped)) {
          for (const item of groupItems) {
            expect(item._tag).toBe(groupKey)
            visited.push(item)
          }
        }

        // Assert
        expect(visited).toHaveLength(items.length)
        for (const item of items) {
          const count = visited.filter((v) => v === item).length
          if (count !== 1) {
            assert.fail(`Expected item to appear exactly once, appeared ${String(count)} times`)
          }
        }
      })
    )
  })
})

// Helpers

/** Creates a MappedRecord with keys A, B, C from three values */
function abcRecord<
  A extends NonNullable<unknown>,
  B extends NonNullable<unknown>,
  C extends NonNullable<unknown>,
>(a: A, b: B, c: C) {
  return fromEntries<readonly ABC[], { A: A; B: B; C: C }>([
    ['A', a],
    ['B', b],
    ['C', c],
  ] as [['A', A], ['B', B], ['C', C]])
}
