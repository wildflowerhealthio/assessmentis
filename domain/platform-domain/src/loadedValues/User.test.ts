import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { User, UserDataError, CurrentUserError } from './User'
import * as fc from 'fast-check'

describe('User', () => {
  test('property: decode-encode cycle preserves user structure', () => {
    // Property: For any valid User, encode(decode(x)) === x
    fc.assert(
      fc.property(
        fc.string(),
        fc.dictionary(fc.string(), fc.array(fc.string())),
        (uid, org_roles) => {
          const decode = Schema.decodeUnknownEither(User)
          const encode = Schema.encodeUnknownEither(User)
          const user = { uid, org_roles }

          const decoded = decode(user)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.uid).toBe(uid)
              expect(encoded.right.org_roles).toEqual(org_roles)
            }
          }
        }
      )
    )
  })

  // Keys that can cause prototype pollution and should be filtered in tests
  const DANGEROUS_KEYS: ReadonlyArray<string> = [
    '__proto__',
    'constructor',
    'prototype',
  ] as const

  test('property: org_roles structure is preserved', () => {
    // Property: org_roles dictionary structure and content is preserved
    // Note: Filters out prototype pollution keys
    fc.assert(
      fc.property(
        fc.string(),
        fc.dictionary(
          fc.string().filter((key) => !DANGEROUS_KEYS.includes(key)),
          fc.array(fc.string())
        ),
        (uid, org_roles) => {
          const decode = Schema.decodeUnknownEither(User)
          const user = { uid, org_roles }

          const result = decode(user)
          if (Either.isRight(result)) {
            // Compare actual enumerable keys (which filters out __proto__)
            const inputKeys = Object.keys(org_roles).sort()
            const outputKeys = Object.keys(result.right.org_roles).sort()
            expect(outputKeys).toEqual(inputKeys)

            Object.entries(org_roles).forEach(([orgSlug, roles]) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              expect(result.right.org_roles[orgSlug as any]).toEqual(roles)
            })
          }
        }
      )
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: User must have both uid and org_roles
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            org_roles: fc.dictionary(fc.string(), fc.array(fc.string())),
          }), // Missing uid
          fc.record({ uid: fc.string() }) // Missing org_roles
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(User)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: empty org_roles is valid', () => {
    // Property: User can have an empty org_roles dictionary
    fc.assert(
      fc.property(fc.string(), (uid) => {
        const decode = Schema.decodeUnknownEither(User)
        const user = { uid, org_roles: {} }

        const result = decode(user)
        expect(Either.isRight(result)).toBe(true)
        if (Either.isRight(result)) {
          expect(Object.keys(result.right.org_roles)).toHaveLength(0)
        }
      })
    )
  })
})

describe('UserDataError', () => {
  test('property: encode-decode preserves error with cause', () => {
    // Property: For any cause value, encode-decode should preserve it
    fc.assert(
      fc.property(fc.option(fc.anything(), { nil: undefined }), (cause) => {
        const decode = Schema.decodeUnknownEither(UserDataError)
        const encode = Schema.encodeUnknownEither(UserDataError)

        const error =
          cause !== undefined
            ? { _tag: 'UserDataError' as const, cause }
            : { _tag: 'UserDataError' as const }

        const encoded = encode(error)
        expect(Either.isRight(encoded)).toBe(true)

        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            expect(decoded.right._tag).toBe('UserDataError')
            if (cause !== undefined) {
              expect(decoded.right.cause).toEqual(cause)
            }
          }
        }
      })
    )
  })

  test('property: invalid _tag always fails', () => {
    // Property: Only correct _tag value decodes successfully
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'UserDataError'),
        (tag) => {
          const decode = Schema.decodeUnknownEither(UserDataError)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('CurrentUserError', () => {
  test('property: union accepts all valid member types', () => {
    // Property: CurrentUserError should accept all User and UserId error types
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            _tag: fc.constant('UserDataError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.record({
            _tag: fc.constant('AuthStateError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(CurrentUserError)
          const result = decode(error)

          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect([
              'UserDataError',
              'AuthStateError',
              'NotLoggedIn',
            ]).toContain(result.right._tag)
          }
        }
      )
    )
  })

  test('property: encode-decode preserves union member identity', () => {
    // Property: For any valid union member, encode-decode should preserve it
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ _tag: 'AuthStateLoading' as const }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(CurrentUserError)
          const encode = Schema.encodeUnknownEither(CurrentUserError)

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
              s !== 'UserDataError' &&
              s !== 'AuthStateLoading' &&
              s !== 'AuthStateError' &&
              s !== 'NotLoggedIn'
          ),
        (tag) => {
          const decode = Schema.decodeUnknownEither(CurrentUserError)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
