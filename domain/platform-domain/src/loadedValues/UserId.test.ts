import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import {
  UserId,
  AuthStateError,
  AuthStateLoading,
  NotLoggedIn,
  CurrentUserIdError,
} from './UserId'
import * as fc from 'fast-check'

describe('UserId', () => {
  test('property: decode-encode cycle preserves all string values', () => {
    // Property: For any string, if it decodes successfully, encoding should return the original
    fc.assert(
      fc.property(fc.string(), (str) => {
        const decode = Schema.decodeUnknownEither(UserId)
        const encode = Schema.encodeUnknownEither(UserId)

        const decoded = decode(str)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          expect(Either.isRight(encoded)).toBe(true)
          if (Either.isRight(encoded)) {
            expect(encoded.right).toBe(str)
          }
        }
      })
    )
  })

  test('property: non-string values always fail to decode', () => {
    // Property: Any non-string value should fail to decode
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.object(), fc.constant(null)),
        (value) => {
          const decode = Schema.decodeUnknownEither(UserId)
          const result = decode(value)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: encode is inverse of decode', () => {
    // Property: decode(encode(x)) should equal x
    fc.assert(
      fc.property(fc.string(), (str) => {
        const decode = Schema.decodeUnknownEither(UserId)
        const encode = Schema.encodeUnknownEither(UserId)

        const decoded = decode(str)
        if (Either.isRight(decoded)) {
          const encoded = encode(decoded.right)
          if (Either.isRight(encoded)) {
            const redecoded = decode(encoded.right)
            expect(Either.isRight(redecoded)).toBe(true)
            if (Either.isRight(redecoded)) {
              expect(redecoded.right).toBe(decoded.right)
            }
          }
        }
      })
    )
  })
})

describe('AuthStateError', () => {
  test('property: decode-encode cycle preserves structure', () => {
    // Property: For any valid AuthStateError, encode-decode should be identity
    fc.assert(
      fc.property(fc.option(fc.anything(), { nil: undefined }), (cause) => {
        const decode = Schema.decodeUnknownEither(AuthStateError)
        const encode = Schema.encodeUnknownEither(AuthStateError)

        const error = cause !== undefined
          ? { _tag: 'AuthStateError' as const, cause }
          : { _tag: 'AuthStateError' as const }

        const encoded = encode(error)
        expect(Either.isRight(encoded)).toBe(true)

        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            expect(decoded.right._tag).toBe('AuthStateError')
            if (cause !== undefined) {
              expect(decoded.right.cause).toEqual(cause)
            }
          }
        }
      })
    )
  })

  test('property: _tag field is always AuthStateError', () => {
    // Property: All valid AuthStateError objects must have correct _tag
    fc.assert(
      fc.property(fc.anything(), (cause) => {
        const decode = Schema.decodeUnknownEither(AuthStateError)
        const error = { _tag: 'AuthStateError' as const, cause }

        const result = decode(error)
        if (Either.isRight(result)) {
          expect(result.right._tag).toBe('AuthStateError')
        }
      })
    )
  })

  test('property: invalid _tag always fails', () => {
    // Property: Any object without correct _tag should fail
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'AuthStateError'),
        (tag) => {
          const decode = Schema.decodeUnknownEither(AuthStateError)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('AuthStateLoading', () => {
  test('property: decode-encode is identity for AuthStateLoading', () => {
    // Property: encode(decode(x)) === x for the loading state
    const decode = Schema.decodeUnknownEither(AuthStateLoading)
    const encode = Schema.encodeUnknownEither(AuthStateLoading)
    const loading = { _tag: 'AuthStateLoading' as const }

    const decoded = decode(loading)
    expect(Either.isRight(decoded)).toBe(true)

    if (Either.isRight(decoded)) {
      const encoded = encode(decoded.right)
      expect(Either.isRight(encoded)).toBe(true)
      if (Either.isRight(encoded)) {
        expect(encoded.right).toEqual(loading)
      }
    }
  })

  test('property: _tag must be AuthStateLoading', () => {
    // Property: Only objects with correct _tag decode successfully
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'AuthStateLoading'),
        (tag) => {
          const decode = Schema.decodeUnknownEither(AuthStateLoading)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('NotLoggedIn', () => {
  test('property: decode-encode is identity for NotLoggedIn', () => {
    // Property: encode(decode(x)) === x for the not logged in state
    const decode = Schema.decodeUnknownEither(NotLoggedIn)
    const encode = Schema.encodeUnknownEither(NotLoggedIn)
    const notLoggedIn = { _tag: 'NotLoggedIn' as const }

    const decoded = decode(notLoggedIn)
    expect(Either.isRight(decoded)).toBe(true)

    if (Either.isRight(decoded)) {
      const encoded = encode(decoded.right)
      expect(Either.isRight(encoded)).toBe(true)
      if (Either.isRight(encoded)) {
        expect(encoded.right).toEqual(notLoggedIn)
      }
    }
  })

  test('property: _tag must be NotLoggedIn', () => {
    // Property: Only objects with correct _tag decode successfully
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'NotLoggedIn'),
        (tag) => {
          const decode = Schema.decodeUnknownEither(NotLoggedIn)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('CurrentUserIdError', () => {
  test('property: union accepts all valid member types', () => {
    // Property: The union should accept all three valid types
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ _tag: 'AuthStateLoading' as const }),
          fc.record({
            _tag: fc.constant('AuthStateError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(CurrentUserIdError)
          const result = decode(error)
          
          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect(['AuthStateLoading', 'AuthStateError', 'NotLoggedIn']).toContain(
              result.right._tag
            )
          }
        }
      )
    )
  })

  test('property: encode-decode cycle preserves union member identity', () => {
    // Property: For any valid union member, encode-decode should preserve it
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ _tag: 'AuthStateLoading' as const }),
          fc.record({
            _tag: fc.constant('AuthStateError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(CurrentUserIdError)
          const encode = Schema.encodeUnknownEither(CurrentUserIdError)

          const decoded = decode(error)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            
            if (Either.isRight(encoded)) {
              const redecoded = decode(encoded.right)
              expect(Either.isRight(redecoded)).toBe(true)
              if (Either.isRight(redecoded)) {
                expect(redecoded.right._tag).toBe(decoded.right._tag)
              }
            }
          }
        }
      )
    )
  })

  test('property: invalid _tag values always fail', () => {
    // Property: Any _tag not in the union should fail
    fc.assert(
      fc.property(
        fc
          .string()
          .filter(
            (s) =>
              s !== 'AuthStateLoading' &&
              s !== 'AuthStateError' &&
              s !== 'NotLoggedIn'
          ),
        (tag) => {
          const decode = Schema.decodeUnknownEither(CurrentUserIdError)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
