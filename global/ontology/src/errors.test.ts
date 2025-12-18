import { expect, test, describe } from 'vitest'
import * as fc from 'fast-check'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
  NeedsAuthenticationError,
} from './errors'

describe('Domain Errors', () => {
  describe('UnhandledError', () => {
    test('property: preserves message from Error cause', () => {
      fc.assert(
        fc.property(fc.string(), (message) => {
          const cause = new Error(message)
          const error = new UnhandledError({ cause })
          expect(error.message).toBe(message)
        })
      )
    })

    test('property: preserves stack from Error cause', () => {
      fc.assert(
        fc.property(fc.string(), (message) => {
          const cause = new Error(message)
          const error = new UnhandledError({ cause })
          expect(error.stack).toBe(cause.stack)
        })
      )
    })

    test('property: uses custom message when provided with Error cause', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (causeMessage, customMessage) => {
          const cause = new Error(causeMessage)
          const error = new UnhandledError({ cause, message: customMessage })
          expect(error.message).toBe(customMessage)
        })
      )
    })

    test('property: handles non-Error causes', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.integer(), fc.object(), fc.constant(null)),
          fc.option(fc.string(), { nil: undefined }),
          (cause, message) => {
            const error = new UnhandledError({ cause, message })
            expect(error.cause).toBe(cause)
            if (message !== undefined) {
              expect(error.message).toBe(message)
            }
          }
        )
      )
    })

    test('property: tags errors with Unhandled prefix when cause has a name', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (name, message) => {
          const cause = new Error(message)
          cause.name = name
          const error = new UnhandledError({ cause })
          expect(error.name).toBe(`Unhandled${name}`)
        })
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

    test('property: tags errors with Unhandled prefix when cause has a name', () => {
      fc.assert(
        fc.property(
          fc.string(),
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

  describe('NeedsAuthenticationError', () => {
    test('property: accepts optional cause', () => {
      fc.assert(
        fc.property(
          fc.option(
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.constantFrom(new Error('test')),
              fc.constant(null)
            ),
            { nil: undefined }
          ),
          (cause) => {
            const error = new NeedsAuthenticationError({ cause })
            if (cause !== undefined) {
              expect(error.cause).toBe(cause)
            } else {
              expect(error.cause).toBeUndefined()
            }
          }
        )
      )
    })

    test('property: can be created without parameters', () => {
      const error = new NeedsAuthenticationError({})
      expect(error).toBeInstanceOf(NeedsAuthenticationError)
      expect(error.cause).toBeUndefined()
    })
  })
})
