import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  promiseFieldsFromPromise,
  promiseFieldsFromObject,
  fromPromiseFields,
} from './PromiseFields'

// Helper to create a promise with external resolve/reject (polyfill for Promise.withResolvers)
function createDeferredPromise<T>() {
  let resolve: (value: T) => void = undefined as any
  let reject: (reason?: unknown) => void = undefined as any
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PromiseFields', () => {
  describe('promiseFieldsFromObject', () => {
    describe('field access returns promises', () => {
      it('property: each field access returns a promise that resolves to the field value', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({ a: fc.integer(), b: fc.string(), c: fc.boolean() }),
            async (obj) => {
              const proxy = promiseFieldsFromObject(obj)

              const aValue = await proxy.a
              const bValue = await proxy.b
              const cValue = await proxy.c

              expect(aValue).toBe(obj.a)
              expect(bValue).toBe(obj.b)
              expect(cValue).toBe(obj.c)
            }
          )
        )
      })
    })

    describe('non-existent fields', () => {
      it('property: accessing non-existent fields returns undefined', async () => {
        await fc.assert(
          fc.asyncProperty(fc.record({ a: fc.integer() }), async (obj) => {
            const proxy = promiseFieldsFromObject(obj)

            // Access a field that doesn't exist
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nonExistent = await (proxy as any).nonExistentField

            expect(nonExistent).toBeUndefined()
          })
        )
      })
    })
  })

  describe('promiseFieldsFromPromise', () => {
    describe('field access resolves through promise', () => {
      it('property: each field access waits for the promise and returns the field value', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({ x: fc.integer(), y: fc.string() }),
            async (obj) => {
              const promise = Promise.resolve(obj)
              const proxy = promiseFieldsFromPromise(promise)

              const xValue = await proxy.x
              const yValue = await proxy.y

              expect(xValue).toBe(obj.x)
              expect(yValue).toBe(obj.y)
            }
          )
        )
      })
    })

    describe('with programmatic promise resolution', () => {
      it('property: fields resolve after the promise is resolved programmatically', async () => {
        await fc.assert(
          fc.asyncProperty(fc.record({ value: fc.integer() }), async (obj) => {
            const { promise, resolve } = createDeferredPromise<typeof obj>()
            const proxy = promiseFieldsFromPromise(promise)

            // Resolve the promise programmatically
            resolve(obj)

            const value = await proxy.value

            expect(value).toBe(obj.value)
          })
        )
      })
    })

    describe('non-existent fields', () => {
      it('property: accessing non-existent fields returns undefined', async () => {
        await fc.assert(
          fc.asyncProperty(fc.record({ a: fc.integer() }), async (obj) => {
            const promise = Promise.resolve(obj)
            const proxy = promiseFieldsFromPromise(promise)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nonExistent = await (proxy as any).nonExistentField

            expect(nonExistent).toBeUndefined()
          })
        )
      })
    })

    describe('with rejected promise', () => {
      it('property: field access rejects with the promise error', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const { promise, reject } = createDeferredPromise<{ value: number }>()
            const proxy = promiseFieldsFromPromise(promise)

            const valuePromise = proxy.value
            const error = new Error(errorMsg)
            reject(error)

            await expect(valuePromise).rejects.toThrow(errorMsg)
          })
        )
      })
    })
  })

  describe('fromPromiseFields', () => {
    describe('unwraps promise fields', () => {
      it('property: unwraps object with promise values to plain object', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({ a: fc.integer(), b: fc.string() }),
            async (obj) => {
              const promiseObj = {
                a: Promise.resolve(obj.a),
                b: Promise.resolve(obj.b),
              }

              const result = await fromPromiseFields(promiseObj)

              expect(result).toEqual(obj)
            }
          )
        )
      })
    })

    describe('handles non-promise values', () => {
      it('property: passes through non-promise values unchanged', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({ a: fc.integer(), b: fc.string() }),
            async (obj) => {
              const { promise, resolve } = createDeferredPromise<string>()
              
              // Mix of promise and non-promise values
              const mixedObj = {
                a: obj.a, // not a promise
                b: promise, // is a promise that we'll resolve programmatically
              }

              // Resolve the promise programmatically
              resolve(obj.b)

              const result = await fromPromiseFields(mixedObj)

              expect(result.a).toBe(obj.a)
              expect(result.b).toBe(obj.b)
            }
          )
        )
      })
    })
  })

  describe('round-trip property', () => {
    describe('promiseFieldsFromObject -> fromPromiseFields', () => {
      it('property: round-trip preserves object equality', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              num: fc.integer(),
              str: fc.string(),
              bool: fc.boolean(),
            }),
            async (obj) => {
              const proxy = promiseFieldsFromObject(obj)

              // Access all fields to get promises, then unwrap
              const promiseObj = {
                num: proxy.num,
                str: proxy.str,
                bool: proxy.bool,
              }
              const result = await fromPromiseFields(promiseObj)

              expect(result).toEqual(obj)
            }
          )
        )
      })
    })

    describe('with nested objects', () => {
      it('property: handles flat object structures', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.integer(),
              name: fc.string(),
              active: fc.boolean(),
            }),
            async (obj) => {
              const proxy = promiseFieldsFromObject(obj)

              const id = await proxy.id
              const name = await proxy.name
              const active = await proxy.active

              expect(id).toBe(obj.id)
              expect(name).toBe(obj.name)
              expect(active).toBe(obj.active)
            }
          )
        )
      })
    })
  })

  describe('concurrent field access', () => {
    it('property: multiple concurrent field accesses resolve correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({ a: fc.integer(), b: fc.integer(), c: fc.integer() }),
          async (obj) => {
            const proxy = promiseFieldsFromObject(obj)

            // Access all fields concurrently
            const [a, b, c] = await Promise.all([proxy.a, proxy.b, proxy.c])

            expect(a).toBe(obj.a)
            expect(b).toBe(obj.b)
            expect(c).toBe(obj.c)
          }
        )
      )
    })
  })
})
