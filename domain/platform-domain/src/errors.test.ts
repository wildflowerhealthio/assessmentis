import { describe, it, expect } from 'vitest'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { AuthError, AuthzError } from './errors'

describe('AuthError', () => {
  const authErrorArb = Arbitrary.make(AuthError)

  it('property: round-trips through encode/decode', () => {
    fc.assert(
      fc.property(authErrorArb, (error) => {
        const encoded = Schema.encodeSync(AuthError)(error)
        const decoded = Schema.decodeSync(AuthError)(encoded)
        expect(decoded).toEqual(error)
      })
    )
  })

  describe('Unauthenticated', () => {
    it('creates error with expected message', () => {
      const error = AuthError.Unauthenticated()
      expect(error.message).toBe('User is not authenticated')
      expect(error._tag).toBe('AuthError')
    })
  })
})

describe('AuthzError', () => {
  const authzErrorArb = Arbitrary.make(AuthzError)

  it('property: round-trips through encode/decode', () => {
    fc.assert(
      fc.property(authzErrorArb, (error) => {
        const encoded = Schema.encodeSync(AuthzError)(error)
        const decoded = Schema.decodeSync(AuthzError)(encoded)
        expect(decoded).toEqual(error)
      })
    )
  })
})
