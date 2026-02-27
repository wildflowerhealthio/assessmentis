import { assert, describe, expect, test } from 'vitest'
import { Schema } from 'effect'
import { capitalize } from 'effect/String'
import * as fc from 'fast-check'
import { AllDatatypeKeys, DatatypeChoice } from './Datatype'
import { MergeClasses } from '@assessmentis/util'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A random non-empty subset of AllDatatypeKeys (order preserved). */
const pickedKeysArb = fc
  .subarray([...AllDatatypeKeys], { minLength: 1 })
  .map((arr) => arr as ReadonlyArray<(typeof AllDatatypeKeys)[number]>)

/** A short alphabetic prefix — realistic for FHIR choice element names. */
const prefixArb = fc.string({
  unit: 'grapheme-ascii',
  minLength: 1,
  maxLength: 12,
})

/**
 * Given a set of prefixed keys, generate an object where each key is
 * independently present (opaque non-undefined value) or absent (undefined).
 * Returns both the object and the count of defined keys.
 */
const presencePatternArb = (keys: ReadonlyArray<string>) =>
  fc.tuple(...keys.map(() => fc.boolean())).map((flags) => {
    const obj: Record<string, unknown> = {}
    let definedCount = 0
    keys.forEach((key, i) => {
      obj[key] = flags[i] ? Symbol(key) : undefined
      if (flags[i]) definedCount++
    })
    return { obj, definedCount }
  })

// ---------------------------------------------------------------------------
// DatatypeChoice
// ---------------------------------------------------------------------------

describe('DatatypeChoice', () => {
  describe('fields', () => {
    test('property: output has exactly one key per picked key', () => {
      fc.assert(
        fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
          const { fields } = DatatypeChoice(prefix, picked)
          expect(Object.keys(fields)).toHaveLength(picked.length)
        })
      )
    })

    test('property: every output key equals prefix + capitalize(pickedKey)', () => {
      fc.assert(
        fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
          const { fields } = DatatypeChoice(prefix, picked)
          const resultKeys = Object.keys(fields)
          const expectedKeys = picked.map((k) => `${prefix}${capitalize(k)}`)
          expect(new Set(resultKeys)).toEqual(new Set(expectedKeys))
        })
      )
    })

    test('property: output fields are usable in Schema.Struct decode round-trip', () => {
      fc.assert(
        fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
          const Mixin = DatatypeChoice(prefix, picked)
          // Should not throw — validates the cast produced valid Schema fields
          const TestSchema = Schema.Struct(Mixin.fields)
          // All fields are optional, so an empty object should decode
          const decoded = Schema.decodeSync(TestSchema)({})
          expect(decoded).toBeDefined()
        })
      )
    })
  })

  describe('Mixin', () => {
    describe('all${capitalize(prefix)}Keys', () => {
      test('property: matches Object.keys(fields)', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            expect(
              new Set([...Mixin[`all${capitalize(prefix)}Keys`]()])
            ).toEqual(new Set(Object.keys(Mixin.fields)))
          })
        )
      })

      test('property: idempotent — multiple calls return equal results', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            expect(Mixin[`all${capitalize(prefix)}Keys`]()).toEqual(
              Mixin[`all${capitalize(prefix)}Keys`]()
            )
          })
        )
      })
    })

    describe('choice invariants', () => {
      test('property: isExactlyOnePresent iff exactly one key is defined', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin[`all${capitalize(prefix)}Keys`]()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                expect(
                  instance[`isExactlyOne${capitalize(prefix)}Present`]()
                ).toBe(definedCount === 1)
              })
            )
          })
        )
      })

      test('property: isNonePresent iff zero keys are defined', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin[`all${capitalize(prefix)}Keys`]()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                expect(instance[`isNo${capitalize(prefix)}Present`]()).toBe(
                  definedCount === 0
                )
              }),
              { numRuns: 10 }
            )
          }),
          { numRuns: 10 }
        )
      })

      test('property: isExactlyOnePresent and isNonePresent are never both true', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin[`all${capitalize(prefix)}Keys`]()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                if (
                  instance[`isExactlyOne${capitalize(prefix)}Present`]() &&
                  instance[`isNo${capitalize(prefix)}Present`]()
                ) {
                  assert.fail(
                    'isExactlyOnePresent and isNonePresent must be mutually exclusive'
                  )
                }
              })
            )
          })
        )
      })

      test('property: MECE — every presence pattern is classified by exactly one of three cases', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin[`all${capitalize(prefix)}Keys`]()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                const none = instance[`isNo${capitalize(prefix)}Present`]()
                const exactlyOne =
                  instance[`isExactlyOne${capitalize(prefix)}Present`]()

                if (definedCount === 0) {
                  expect(none).toBe(true)
                  expect(exactlyOne).toBe(false)
                } else if (definedCount === 1) {
                  expect(none).toBe(false)
                  expect(exactlyOne).toBe(true)
                } else {
                  // more than one defined
                  expect(none).toBe(false)
                  expect(exactlyOne).toBe(false)
                }
              }),
              { numRuns: 10 }
            )
          }),
          { numRuns: 10 }
        )
      })
    })
  })
})

// ---------------------------------------------------------------------------
// DatatypeChoice with MergeClasses
// ---------------------------------------------------------------------------

const ValueMixin = DatatypeChoice('value', ['string', 'boolean', 'integer'])

class MergedWithChoice extends MergeClasses<MergedWithChoice>(
  'MergedWithChoice'
)(ValueMixin, { extra: Schema.String }) {}

describe('DatatypeChoice with MergeClasses', () => {
  describe('fields', () => {
    test('merged class has DatatypeChoice fields and plain fields', () => {
      expect(MergedWithChoice.fields).toHaveProperty('valueString')
      expect(MergedWithChoice.fields).toHaveProperty('valueBoolean')
      expect(MergedWithChoice.fields).toHaveProperty('valueInteger')
      expect(MergedWithChoice.fields).toHaveProperty('extra')
    })

    test('no extra fields beyond what was specified', () => {
      expect(Object.keys(MergedWithChoice.fields)).toHaveLength(4)
    })
  })

  describe('static methods', () => {
    test('allValueKeys returns the prefixed keys', () => {
      const keys = (
        MergedWithChoice as unknown as Record<
          string,
          () => ReadonlyArray<string>
        >
      ).allValueKeys()
      expect(new Set(keys)).toEqual(
        new Set(['valueString', 'valueBoolean', 'valueInteger'])
      )
    })
  })

  describe('instance via constructor', () => {
    const instance = new MergedWithChoice({
      extra: 'test',
      valueString: 'hello',
    })

    test('preserves field values', () => {
      expect(instance.extra).toBe('test')
      expect(instance.valueString).toBe('hello')
    })

    test('isExactlyOneValuePresent when one value is set', () => {
      expect(
        (instance as unknown as Record<string, unknown>)
          .isExactlyOneValuePresent
      ).toBeTypeOf('function')
      expect(
        (
          instance as unknown as { isExactlyOneValuePresent(): boolean }
        ).isExactlyOneValuePresent()
      ).toBe(true)
    })

    test('isNoValuePresent when no values are set', () => {
      const empty = new MergedWithChoice({ extra: 'x' })
      expect(
        (empty as unknown as { isNoValuePresent(): boolean }).isNoValuePresent()
      ).toBe(true)
    })

    test('isExactlyOneValuePresent false when multiple values set', () => {
      const multi = new MergedWithChoice({
        extra: 'x',
        valueString: 'a',
        valueBoolean: true,
      })
      expect(
        (
          multi as unknown as { isExactlyOneValuePresent(): boolean }
        ).isExactlyOneValuePresent()
      ).toBe(false)
    })
  })

  describe('instance via make()', () => {
    test('preserves field values', () => {
      const instance = MergedWithChoice.make({
        extra: 'world',
        valueInteger: 42,
      })
      expect(instance.extra).toBe('world')
      expect(instance.valueInteger).toBe(42)
    })

    test('choice methods work on make() instances', () => {
      const instance = MergedWithChoice.make({
        extra: 'world',
        valueInteger: 42,
      })
      expect(
        (
          instance as unknown as { isExactlyOneValuePresent(): boolean }
        ).isExactlyOneValuePresent()
      ).toBe(true)
    })
  })

  describe('Schema.decode', () => {
    const decode = Schema.decodeUnknownSync(MergedWithChoice)

    test('decodes valid input', () => {
      const result = decode({ extra: 'decoded', valueString: 'hi' })
      expect(result.extra).toBe('decoded')
      expect(result.valueString).toBe('hi')
    })

    test('decoded instances have choice methods', () => {
      const result = decode({ extra: 'decoded', valueBoolean: true })
      expect(
        (
          result as unknown as { isExactlyOneValuePresent(): boolean }
        ).isExactlyOneValuePresent()
      ).toBe(true)
    })

    test('rejects invalid input', () => {
      expect(() => decode({ extra: 123 })).toThrow()
    })
  })

  describe('choice invariants through MergeClasses', () => {
    test('property: isExactlyOnePresent and isNoPresent are correct', () => {
      const keys = ['valueString', 'valueBoolean', 'valueInteger'] as const

      fc.assert(
        fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
          const instance = Object.assign(
            new MergedWithChoice({ extra: 'test' }),
            obj
          )
          const asRecord = instance as unknown as Record<string, () => boolean>
          expect(asRecord.isExactlyOneValuePresent()).toBe(definedCount === 1)
          expect(asRecord.isNoValuePresent()).toBe(definedCount === 0)
        }),
        { numRuns: 20 }
      )
    })
  })
})
