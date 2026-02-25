import { assert, describe, expect, test } from 'vitest'
import { Schema } from 'effect'
import { capitalize } from 'effect/String'
import * as fc from 'fast-check'
import { AllDatatypeKeys, DatatypeChoice } from './Datatype'

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
    describe('allOptionKeys', () => {
      test('property: matches Object.keys(fields)', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            expect(new Set([...Mixin.allOptionKeys()])).toEqual(
              new Set(Object.keys(Mixin.fields))
            )
          })
        )
      })

      test('property: idempotent — multiple calls return equal results', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            expect(Mixin.allOptionKeys()).toEqual(Mixin.allOptionKeys())
          })
        )
      })
    })

    describe('choice invariants', () => {
      test('property: isExactlyOnePresent iff exactly one key is defined', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin.allOptionKeys()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                expect(instance.isExactlyOnePresent()).toBe(definedCount === 1)
              })
            )
          })
        )
      })

      test('property: isNonePresent iff zero keys are defined', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin.allOptionKeys()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                expect(instance.isNonePresent()).toBe(definedCount === 0)
              })
            )
          })
        )
      })

      test('property: isExactlyOnePresent and isNonePresent are never both true', () => {
        fc.assert(
          fc.property(prefixArb, pickedKeysArb, (prefix, picked) => {
            const Mixin = DatatypeChoice(prefix, picked)
            const keys = Mixin.allOptionKeys()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                if (
                  instance.isExactlyOnePresent() &&
                  instance.isNonePresent()
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
            const keys = Mixin.allOptionKeys()

            return fc.assert(
              fc.property(presencePatternArb(keys), ({ obj, definedCount }) => {
                const instance = Object.assign(
                  Object.create(Mixin.prototype),
                  obj
                )
                const none = instance.isNonePresent()
                const exactlyOne = instance.isExactlyOnePresent()

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
              })
            )
          })
        )
      })
    })
  })
})
