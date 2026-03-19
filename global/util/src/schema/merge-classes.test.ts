import { Arbitrary, FastCheck, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { mergeArbitraries } from './merge-arbitraries'
import { MergeClasses } from './merge-classes'

// --- MergeClasses fixtures ---

class Alpha extends Schema.Class<Alpha>('Alpha')({
  alpha: Schema.String,
}) {
  static readonly ALPHA = 'ALPHA' as const
  alphaMethod() {
    return 'alpha' as const
  }
}

class Beta extends Schema.Class<Beta>('Beta')({
  beta: Schema.Int,
}) {
  static readonly BETA = 'BETA' as const
  betaMethod() {
    return 'beta' as const
  }
}

class AlphaBeta extends MergeClasses<AlphaBeta>('AlphaBeta')([], Alpha, Beta) {
  combinedMethod() {
    return `${this.alphaMethod()}-${this.betaMethod()}` as const
  }
}

class Gamma extends Schema.Class<Gamma>('Gamma')({
  gamma: Schema.Boolean,
}) {
  static readonly GAMMA = 'GAMMA' as const
  gammaMethod() {
    return 'gamma' as const
  }
}

class AlphaBetaGamma extends MergeClasses<AlphaBetaGamma>('AlphaBetaGamma')(
  [],
  Alpha,
  Beta,
  Gamma
) {}

const choiceArbitrary = (fc: typeof FastCheck) =>
  fc.oneof(
    fc.string().map((s: string) => ({ valueA: s })),
    fc.double().map((n: number) => ({ valueB: n }))
  )

describe('MergeClasses', () => {
  describe('fields', () => {
    it('merges fields from all input classes', () => {
      expect(AlphaBeta.fields).toHaveProperty('alpha')
      expect(AlphaBeta.fields).toHaveProperty('beta')
    })

    it('merges fields from three input classes', () => {
      expect(AlphaBetaGamma.fields).toHaveProperty('alpha')
      expect(AlphaBetaGamma.fields).toHaveProperty('beta')
      expect(AlphaBetaGamma.fields).toHaveProperty('gamma')
    })
  })

  describe('static members', () => {
    it('copies static properties from the first class', () => {
      expect(AlphaBeta.ALPHA).toBe('ALPHA')
    })

    it('copies static properties from the second class', () => {
      expect(AlphaBeta.BETA).toBe('BETA')
    })

    it('types first class statics correctly', () => {
      expectTypeOf(AlphaBeta.ALPHA).toEqualTypeOf<'ALPHA'>()
    })

    it('types second class statics correctly', () => {
      expectTypeOf(AlphaBeta.BETA).toEqualTypeOf<'BETA'>()
    })
  })

  describe('instance via constructor', () => {
    const instance = new AlphaBeta({ alpha: 'hello', beta: 42 })

    it('preserves field values', () => {
      expect(instance.alpha).toBe('hello')
      expect(instance.beta).toBe(42)
    })

    it('has methods from the first class', () => {
      expect(instance.alphaMethod()).toBe('alpha')
    })

    it('has methods from the second class', () => {
      expect(instance.betaMethod()).toBe('beta')
    })

    it('has methods defined on the merged class', () => {
      expect(instance.combinedMethod()).toBe('alpha-beta')
    })

    it('types field values correctly', () => {
      expectTypeOf(instance.alpha).toEqualTypeOf<string>()
      expectTypeOf(instance.beta).toEqualTypeOf<number>()
    })

    it('types inherited methods correctly', () => {
      expectTypeOf(instance.alphaMethod).toBeFunction()
      expectTypeOf(instance.betaMethod).toBeFunction()
      // oxlint-disable-next-line typescript/unbound-method
      expectTypeOf(instance.combinedMethod).toBeFunction()
    })
  })

  describe('instance via make()', () => {
    const instance = AlphaBeta.make({ alpha: 'world', beta: 7 })

    it('preserves field values', () => {
      expect(instance.alpha).toBe('world')
      expect(instance.beta).toBe(7)
    })

    it('has methods from the first class', () => {
      expect(instance.alphaMethod()).toBe('alpha')
    })

    it('has methods from the second class', () => {
      expect(instance.betaMethod()).toBe('beta')
    })

    it('has methods defined on the merged class', () => {
      expect(instance.combinedMethod()).toBe('alpha-beta')
    })

    it('types make() return with all members', () => {
      expectTypeOf(instance.alpha).toEqualTypeOf<string>()
      expectTypeOf(instance.beta).toEqualTypeOf<number>()
      expectTypeOf(instance.alphaMethod).toBeFunction()
      expectTypeOf(instance.betaMethod).toBeFunction()
      // oxlint-disable-next-line typescript/unbound-method
      expectTypeOf(instance.combinedMethod).toBeFunction()
    })
  })

  describe('Schema.decode', () => {
    const decode = Schema.decodeUnknownSync(AlphaBeta)

    it('decodes valid input', () => {
      const result = decode({ alpha: 'decoded', beta: 1 })
      expect(result.alpha).toBe('decoded')
      expect(result.beta).toBe(1)
    })

    it('decoded instances have inherited methods', () => {
      const result = decode({ alpha: 'test', beta: 2 })
      expect(result.alphaMethod()).toBe('alpha')
      expect(result.betaMethod()).toBe('beta')
      expect(result.combinedMethod()).toBe('alpha-beta')
    })

    it('rejects invalid input', () => {
      expect(() => decode({ alpha: 123, beta: 1 })).toThrow()
    })
  })

  describe('3-class merge', () => {
    describe('static members', () => {
      it('copies statics from all three classes', () => {
        expect(AlphaBetaGamma.ALPHA).toBe('ALPHA')
        expect(AlphaBetaGamma.BETA).toBe('BETA')
        expect(AlphaBetaGamma.GAMMA).toBe('GAMMA')
      })
    })

    describe('instance via constructor', () => {
      const instance = new AlphaBetaGamma({
        alpha: 'a',
        beta: 1,
        gamma: true,
      })

      it('preserves all field values', () => {
        expect(instance.alpha).toBe('a')
        expect(instance.beta).toBe(1)
        expect(instance.gamma).toBe(true)
      })

      it('has methods from all three classes', () => {
        expect(instance.alphaMethod()).toBe('alpha')
        expect(instance.betaMethod()).toBe('beta')
        expect(instance.gammaMethod()).toBe('gamma')
      })
    })

    describe('instance via make()', () => {
      const instance = AlphaBetaGamma.make({
        alpha: 'b',
        beta: 2,
        gamma: false,
      })

      it('preserves all field values', () => {
        expect(instance.alpha).toBe('b')
        expect(instance.beta).toBe(2)
        expect(instance.gamma).toBe(false)
      })

      it('has methods from all three classes', () => {
        expect(instance.alphaMethod()).toBe('alpha')
        expect(instance.betaMethod()).toBe('beta')
        expect(instance.gammaMethod()).toBe('gamma')
      })
    })
  })

  describe('annotations', () => {
    const choiceFields = {
      valueA: Schema.optional(Schema.String),
      valueB: Schema.optional(Schema.Number),
    }

    const extraFields = { extra: Schema.String }

    class MergedWithArbitrary extends MergeClasses<MergedWithArbitrary>('MergedWithArbitrary')(
      [
        {
          arbitrary: () =>
            mergeArbitraries(
              (props) => MergedWithArbitrary.make(props),
              choiceArbitrary,
              extraFields
            ),
        },
      ],
      choiceFields,
      extraFields
    ) {}

    it('Arbitrary.make produces instances with correct prototype', () => {
      const arb = Arbitrary.make(MergedWithArbitrary as any)
      const samples = fc.sample(arb, 10)
      for (const s of samples) {
        expect(s).toBeInstanceOf(MergedWithArbitrary)
      }
    })

    it('Arbitrary.make respects the custom arbitrary constraints', () => {
      const arb = Arbitrary.make(MergedWithArbitrary as any)
      const samples = fc.sample(arb, 20)
      for (const s of samples) {
        const rec = s as Record<string, unknown>
        expect(rec).toHaveProperty('extra')
        const count = [rec.valueA, rec.valueB].filter((v) => v !== undefined).length
        expect(count).toBeLessThanOrEqual(1)
      }
    })

    it('without annotations, existing behavior is unchanged', () => {
      const instance = new AlphaBeta({ alpha: 'test', beta: 1 })
      expect(instance.alpha).toBe('test')
      expect(instance.alphaMethod()).toBe('alpha')
    })
  })
})
