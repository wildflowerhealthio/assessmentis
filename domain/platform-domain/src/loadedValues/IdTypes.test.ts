import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { OrgSlug, Role } from './IdTypes'

describe('IdTypes', () => {
  describe('OrgSlug', () => {
    test('creates branded string for valid slug', () => {
      const decode = Schema.decodeUnknownEither(OrgSlug)
      const result = decode('my-org')

      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toBe('my-org')
      }
    })

    test('accepts various slug formats', () => {
      const decode = Schema.decodeUnknownEither(OrgSlug)
      const slugs = ['org1', 'my-org', 'test_org', 'ORG-123']

      slugs.forEach((slug) => {
        const result = decode(slug)
        expect(Either.isRight(result)).toBe(true)
      })
    })

    test('fails for non-string values', () => {
      const decode = Schema.decodeUnknownEither(OrgSlug)
      const result = decode(123)

      expect(Either.isLeft(result)).toBe(true)
    })

    test('encodes branded slug correctly', () => {
      const decode = Schema.decodeUnknownEither(OrgSlug)
      const encode = Schema.encodeUnknownEither(OrgSlug)

      const decoded = decode('test-org')
      if (Either.isRight(decoded)) {
        const encoded = encode(decoded.right)
        expect(Either.isRight(encoded)).toBe(true)
        if (Either.isRight(encoded)) {
          expect(encoded.right).toBe('test-org')
        }
      }
    })
  })

  describe('Role', () => {
    test('creates branded string for valid role', () => {
      const decode = Schema.decodeUnknownEither(Role)
      const result = decode('admin')

      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toBe('admin')
      }
    })

    test('accepts various role names', () => {
      const decode = Schema.decodeUnknownEither(Role)
      const roles = ['admin', 'user', 'viewer', 'editor', 'owner']

      roles.forEach((role) => {
        const result = decode(role)
        expect(Either.isRight(result)).toBe(true)
      })
    })

    test('fails for non-string values', () => {
      const decode = Schema.decodeUnknownEither(Role)
      const result = decode(true)

      expect(Either.isLeft(result)).toBe(true)
    })

    test('encodes branded role correctly', () => {
      const decode = Schema.decodeUnknownEither(Role)
      const encode = Schema.encodeUnknownEither(Role)

      const decoded = decode('admin')
      if (Either.isRight(decoded)) {
        const encoded = encode(decoded.right)
        expect(Either.isRight(encoded)).toBe(true)
        if (Either.isRight(encoded)) {
          expect(encoded.right).toBe('admin')
        }
      }
    })
  })
})
