import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { OrgRole, NoOrgSelected, OrgRoleError } from './OrgRole'
import * as fc from 'fast-check'

describe('OrgRole', () => {
  test('property: decode-encode cycle preserves structure', () => {
    // Property: For any valid OrgRole, encode(decode(x)) === x
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string()),
        (orgSlug, roles) => {
          const decode = Schema.decodeUnknownEither(OrgRole)
          const encode = Schema.encodeUnknownEither(OrgRole)
          const orgRole = { orgSlug, roles }

          const decoded = decode(orgRole)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.orgSlug).toBe(orgSlug)
              expect(encoded.right.roles).toEqual(roles)
            }
          }
        }
      )
    )
  })

  test('property: roles array length is preserved', () => {
    // Property: The number of roles should be preserved through decode-encode
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string()),
        (orgSlug, roles) => {
          const decode = Schema.decodeUnknownEither(OrgRole)
          const orgRole = { orgSlug, roles }

          const result = decode(orgRole)
          if (Either.isRight(result)) {
            expect(result.right.roles.length).toBe(roles.length)
            expect(result.right.roles).toEqual(roles)
          }
        }
      )
    )
  })

  test('property: missing required field always fails', () => {
    // Property: OrgRole must have both orgSlug and roles
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ roles: fc.array(fc.string()) }), // Missing orgSlug
          fc.record({ orgSlug: fc.string() }) // Missing roles
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(OrgRole)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: encode is inverse of decode', () => {
    // Property: decode(encode(decode(x))) === decode(x)
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string()),
        (orgSlug, roles) => {
          const decode = Schema.decodeUnknownEither(OrgRole)
          const encode = Schema.encodeUnknownEither(OrgRole)
          const orgRole = { orgSlug, roles }

          const decoded1 = decode(orgRole)
          if (Either.isRight(decoded1)) {
            const encoded = encode(decoded1.right)
            if (Either.isRight(encoded)) {
              const decoded2 = decode(encoded.right)
              expect(Either.isRight(decoded2)).toBe(true)
              if (Either.isRight(decoded2)) {
                expect(decoded2.right.orgSlug).toBe(decoded1.right.orgSlug)
                expect(decoded2.right.roles).toEqual(decoded1.right.roles)
              }
            }
          }
        }
      )
    )
  })
})

describe('NoOrgSelected', () => {
  test('property: encode-decode is identity for NoOrgSelected', () => {
    // Property: decode(encode(x)) === x for NoOrgSelected state
    const decode = Schema.decodeUnknownEither(NoOrgSelected)
    const encode = Schema.encodeUnknownEither(NoOrgSelected)
    const noOrg = { _tag: 'NoOrgSelected' as const }

    const encoded = encode(noOrg)
    expect(Either.isRight(encoded)).toBe(true)

    if (Either.isRight(encoded)) {
      const decoded = decode(encoded.right)
      expect(Either.isRight(decoded)).toBe(true)
      if (Either.isRight(decoded)) {
        expect(decoded.right._tag).toBe('NoOrgSelected')
      }
    }
  })

  test('property: invalid _tag always fails', () => {
    // Property: Only correct _tag value decodes successfully
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'NoOrgSelected'),
        (tag) => {
          const decode = Schema.decodeUnknownEither(NoOrgSelected)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('OrgRoleError', () => {
  test('property: union accepts all valid member types', () => {
    // Property: OrgRoleError should accept NoOrgSelected and all CurrentUserError types
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ _tag: 'NoOrgSelected' as const }),
          fc.constant({ _tag: 'UserLoading' as const }),
          fc.record({
            _tag: fc.constant('UserDataError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.constant({ _tag: 'AuthStateLoading' as const }),
          fc.record({
            _tag: fc.constant('AuthStateError' as const),
            cause: fc.option(fc.anything(), { nil: undefined }),
          }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(OrgRoleError)
          const result = decode(error)

          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect([
              'NoOrgSelected',
              'UserLoading',
              'UserDataError',
              'AuthStateLoading',
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
          fc.constant({ _tag: 'NoOrgSelected' as const }),
          fc.constant({ _tag: 'UserLoading' as const }),
          fc.constant({ _tag: 'AuthStateLoading' as const }),
          fc.constant({ _tag: 'NotLoggedIn' as const })
        ),
        (error) => {
          const decode = Schema.decodeUnknownEither(OrgRoleError)
          const encode = Schema.encodeUnknownEither(OrgRoleError)

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
              s !== 'NoOrgSelected' &&
              s !== 'UserLoading' &&
              s !== 'UserDataError' &&
              s !== 'AuthStateLoading' &&
              s !== 'AuthStateError' &&
              s !== 'NotLoggedIn'
          ),
        (tag) => {
          const decode = Schema.decodeUnknownEither(OrgRoleError)
          const result = decode({ _tag: tag })
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})
