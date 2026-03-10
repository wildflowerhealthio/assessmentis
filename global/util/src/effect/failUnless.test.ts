import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { Effect } from 'effect'

import {
  failEffectUnless,
  failUnless,
  refineEffectOrFail,
  refineOrFail,
} from './failUnless'

describe('failUnless', () => {
  describe('refineOrFail', () => {
    describe('when condition is a type guard that passes', () => {
      it('property: succeeds with the refined value', () => {
        const isString = (x: unknown): x is string => typeof x === 'string'
        const makeErr = (x: unknown) => `Not a string: ${String(x)}`

        fc.assert(
          fc.property(fc.string(), (val) => {
            const result = Effect.runSync(refineOrFail(isString, makeErr)(val))
            expect(result).toBe(val)
          })
        )
      })
    })

    describe('when condition is a type guard that fails', () => {
      it('property: fails with the error from makeErr', () => {
        const isString = (x: unknown): x is string => typeof x === 'string'
        const makeErr = (x: unknown) => `Not a string: ${String(x)}`

        fc.assert(
          fc.property(fc.integer(), (val) => {
            expect(() =>
              Effect.runSync(refineOrFail(isString, makeErr)(val))
            ).toThrow(`Not a string: ${val}`)
          })
        )
      })
    })
  })

  describe('refineEffectOrFail', () => {
    it('property: can be used with Effect.flatMap to chain validations', () => {
      const isPositive = (x: number): x is number => x > 0
      const makeErr = (x: number) => `Not positive: ${x}`

      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (val) => {
          const result = Effect.runSync(
            Effect.succeed(val).pipe(refineEffectOrFail(isPositive, makeErr))
          )
          expect(result).toBe(val)
        })
      )
    })

    it('property: fails in chain when condition is not met', () => {
      const isPositive = (x: number): x is number => x > 0
      const makeErr = (x: number) => `Not positive: ${x}`

      fc.assert(
        fc.property(fc.integer({ max: 0 }), (val) => {
          expect(() =>
            Effect.runSync(
              Effect.succeed(val).pipe(refineEffectOrFail(isPositive, makeErr))
            )
          ).toThrow(`Not positive: ${val}`)
        })
      )
    })
  })

  describe('failUnless', () => {
    describe('identity property', () => {
      it('property: always succeeds with the input value when condition is always true', () => {
        fc.assert(
          fc.property(fc.integer(), (val) => {
            const result = Effect.runSync(
              failUnless(
                () => true,
                () => 'error'
              )(val)
            )
            expect(result).toBe(val)
          })
        )
      })
    })

    describe('failure property', () => {
      it('property: always fails with makeErr output when condition is always false', () => {
        fc.assert(
          fc.property(fc.integer(), (val) => {
            const errorMsg = `Failed for: ${val}`

            expect(() =>
              Effect.runSync(
                failUnless(
                  () => false,
                  () => errorMsg
                )(val)
              )
            ).toThrow(errorMsg)
          })
        )
      })
    })

    describe('error message receives original value', () => {
      it('property: makeErr is called with the original input', () => {
        fc.assert(
          fc.property(fc.integer(), (val) => {
            let receivedValue: number | undefined
            const makeErr = (n: number) => {
              receivedValue = n
              return 'error'
            }

            try {
              Effect.runSync(failUnless(() => false, makeErr)(val))
            } catch {
              // Expected to fail
            }

            expect(receivedValue).toBe(val)
          })
        )
      })
    })
  })

  describe('failEffectUnless', () => {
    it('property: can be used with Effect.flatMap for chained validation', () => {
      const isPositive = (n: number) => n > 0
      const makeErr = (n: number) => `${n} is not positive`

      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (val) => {
          const result = Effect.runSync(
            Effect.succeed(val).pipe(failEffectUnless(isPositive, makeErr))
          )
          expect(result).toBe(val)
        })
      )
    })

    it('property: fails in chain when condition is not met', () => {
      const isPositive = (n: number) => n > 0
      const makeErr = (n: number) => `${n} is not positive`

      fc.assert(
        fc.property(fc.integer({ max: 0 }), (val) => {
          expect(() =>
            Effect.runSync(
              Effect.succeed(val).pipe(failEffectUnless(isPositive, makeErr))
            )
          ).toThrow(`${val} is not positive`)
        })
      )
    })
  })
})
