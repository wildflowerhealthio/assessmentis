import { describe, expect, test } from 'vitest'
import * as fc from 'fast-check'
import { ExternalAssertionError, NotFoundError, UnhandledError } from './errors'

describe('Domain Errors', () => {
  describe('UnhandledError', () => {
    test('property: uses custom message when provided with Error cause', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (causeMessage, customMessage) => {
          const cause = new Error(causeMessage)
          const error = new UnhandledError({ cause, message: customMessage })
          expect(error.message).toBe(customMessage)
        })
      )
    })

    test('property: tags errors with Unhandled prefix when cause has a non-empty name', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0),
          fc.string(),
          (name, message) => {
            const cause = new Error(message)
            cause.name = name
            const error = new UnhandledError({ message: '', cause })
            expect(error.name).toBe(`Unhandled${name}`)
          }
        )
      )
    })
  })

  describe('ExternalAssertionError', () => {
    test('property: preserves cause', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constantFrom(new Error('test')),
            fc.constant(null)
          ),
          fc.string(),
          (cause, expected) => {
            const error = new ExternalAssertionError({ cause, expected })
            expect(error.cause).toBe(cause)
            expect(error.expected).toBe(expected)
          }
        )
      )
    })

    test('property: preserves message from Error cause', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (message, expected) => {
          const cause = new Error(message)
          const error = new ExternalAssertionError({ cause, expected })
          expect(error.message).toBe(message)
        })
      )
    })

    test('property: preserves stack from Error cause', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (message, expected) => {
          const cause = new Error(message)
          const error = new ExternalAssertionError({ cause, expected })
          expect(error.stack).toBe(cause.stack)
        })
      )
    })

    test('property: tags errors with Unhandled prefix when cause has a non-empty name', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0),
          fc.string(),
          fc.string(),
          (name, message, expected) => {
            const cause = new Error(message)
            cause.name = name
            const error = new ExternalAssertionError({ cause, expected })
            expect(error.name).toBe(`Unhandled${name}`)
          }
        )
      )
    })
  })

  describe('NotFoundError', () => {
    test('property: preserves resourceType and params', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.object(),
          fc.option(
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.constantFrom(new Error('test')),
              fc.constant(null)
            ),
            { nil: undefined }
          ),
          (resourceType, params, cause) => {
            const error = new NotFoundError({ resourceType, params, cause })
            expect(error.resourceType).toBe(resourceType)
            expect(error.params).toEqual(params)
            if (cause !== undefined) {
              expect(error.cause).toBe(cause)
            }
          }
        )
      )
    })

    test('property: accepts optional cause', () => {
      fc.assert(
        fc.property(fc.string(), fc.object(), (resourceType, params) => {
          const error = new NotFoundError({ resourceType, params })
          expect(error.resourceType).toBe(resourceType)
          expect(error.params).toEqual(params)
          expect(error.cause).toBeUndefined()
        })
      )
    })
  })
})
