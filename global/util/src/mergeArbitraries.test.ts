import { describe, expect, it } from 'vitest'
import { Arbitrary, FastCheck, Schema } from 'effect'
import * as fc from 'fast-check'
import { mergeArbitraries } from './mergeArbitraries'

// --- fixtures ---

class Alpha extends Schema.Class<Alpha>('Alpha')({
  alpha: Schema.String,
}) {}

class WithCustomArb extends Schema.Class<WithCustomArb>('WithCustomArb')(
  {
    valueA: Schema.optional(Schema.String),
    valueB: Schema.optional(Schema.Number),
  },
  [
    {
      arbitrary: (): Arbitrary.LazyArbitrary<WithCustomArb> => (fc) =>
        fc.oneof(
          fc.string().map((s) => ({ valueA: s })),
          fc.double().map((n) => ({ valueB: n }))
        ),
    },
  ]
) {}

const plainFields = { extra: Schema.String } as const as Schema.Struct.Fields

describe('mergeArbitraries', () => {
  it('merges a Schema.Class with plain fields', () => {
    const lazy = (_: unknown) =>
      mergeArbitraries(
        (x): Alpha & Schema.Struct.Type<typeof plainFields> => x,
        Alpha,
        plainFields
      )
    const arb = lazy({ maxDepth: 2 })(fc)
    const samples = fc.sample(arb, 10)
    for (const s of samples) {
      expect(s).toHaveProperty('alpha')
      expect(s).toHaveProperty('extra')
      expect(typeof s.alpha).toBe('string')
      expect(typeof s.extra).toBe('string')
    }
  })

  it('merges a Schema.Class with custom arbitrary + plain fields', () => {
    const lazy = (_: unknown) =>
      mergeArbitraries(
        (x): WithCustomArb & Schema.Struct.Type<typeof plainFields> => x,
        WithCustomArb,
        plainFields
      )
    const arb = lazy({ maxDepth: 2 })(fc)
    const samples = fc.sample(arb, 20)
    for (const s of samples) {
      expect(s).toHaveProperty('extra')
      // Custom arbitrary enforces one-or-none on valueA/valueB
      const count = [s.valueA, s.valueB].filter((v) => v !== undefined).length
      expect(count).toBeLessThanOrEqual(1)
    }
  })

  it('merges a LazyArbitrary with plain fields', () => {
    const lazyArb = (fc: typeof FastCheck) => fc.constant({ custom: 'lazy' })
    const lazy = (_: unknown) =>
      mergeArbitraries(
        (x): { custom: 'lazy' } & Schema.Struct.Type<typeof plainFields> => x,
        lazyArb,
        plainFields
      )
    const arb = lazy({ maxDepth: 2 })(fc)
    const samples = fc.sample(arb, 5)
    for (const s of samples) {
      expect(s.custom).toBe('lazy')
      expect(s).toHaveProperty('extra')
    }
  })

  it('merges two plain field objects', () => {
    const lazy = (_: unknown) =>
      mergeArbitraries(
        (x): { a: string; b: number } => x,
        { a: Schema.String },
        { b: Schema.Number }
      )
    const arb = lazy({ maxDepth: 2 })(fc)
    const samples = fc.sample(arb, 10)
    for (const s of samples) {
      expect(typeof s.a).toBe('string')
      expect(typeof s.b).toBe('number')
    }
  })

  it('returns a LazyArbitrary (double-invocation pattern)', () => {
    const lazy = (_: unknown) => mergeArbitraries((x) => x, plainFields)
    expect(typeof lazy).toBe('function')
    const inner = lazy({ maxDepth: 2 })
    expect(typeof inner).toBe('function')
    const arb = inner(fc)
    expect(fc.sample(arb, 1)).toHaveLength(1)
  })
})
