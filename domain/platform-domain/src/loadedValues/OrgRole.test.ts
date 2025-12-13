import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { OrgRole, NoOrgSelected, OrgRoleError } from './OrgRole'

describe('OrgRole', () => {
  test('decodes valid org role structure', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'my-organization',
      roles: ['admin', 'editor'],
    }

    const result = decode(orgRole)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.orgSlug).toBe('my-organization')
      expect(result.right.roles).toContain('admin')
      expect(result.right.roles).toContain('editor')
      expect(result.right.roles).toHaveLength(2)
    }
  })

  test('accepts org role with single role', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'test-org',
      roles: ['viewer'],
    }

    const result = decode(orgRole)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.roles).toHaveLength(1)
      expect(result.right.roles[0]).toBe('viewer')
    }
  })

  test('accepts org role with empty roles array', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'empty-org',
      roles: [],
    }

    const result = decode(orgRole)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.roles).toHaveLength(0)
    }
  })

  test('accepts org role with multiple roles', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'multi-role-org',
      roles: ['admin', 'editor', 'viewer', 'owner', 'contributor'],
    }

    const result = decode(orgRole)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.roles).toHaveLength(5)
    }
  })

  test('fails without orgSlug', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      roles: ['admin'],
    }

    const result = decode(orgRole)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails without roles', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'test-org',
    }

    const result = decode(orgRole)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('encodes org role correctly', () => {
    const decode = Schema.decodeUnknownEither(OrgRole)
    const encode = Schema.encodeUnknownEither(OrgRole)
    const orgRole = {
      orgSlug: 'encode-test',
      roles: ['admin'],
    }

    const decoded = decode(orgRole)
    if (Either.isRight(decoded)) {
      const encoded = encode(decoded.right)
      expect(Either.isRight(encoded)).toBe(true)
      if (Either.isRight(encoded)) {
        expect(encoded.right.orgSlug).toBe('encode-test')
        expect(encoded.right.roles).toContain('admin')
      }
    }
  })
})

describe('NoOrgSelected', () => {
  test('creates no org selected state', () => {
    const encode = Schema.encodeUnknownEither(NoOrgSelected)
    const noOrg = {
      _tag: 'NoOrgSelected',
    }

    const result = encode(noOrg)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NoOrgSelected')
    }
  })

  test('decodes no org selected state', () => {
    const decode = Schema.decodeUnknownEither(NoOrgSelected)
    const noOrg = {
      _tag: 'NoOrgSelected',
    }

    const result = decode(noOrg)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NoOrgSelected')
    }
  })
})

describe('OrgRoleError', () => {
  test('accepts NoOrgSelected', () => {
    const decode = Schema.decodeUnknownEither(OrgRoleError)
    const error = {
      _tag: 'NoOrgSelected',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NoOrgSelected')
    }
  })

  test('accepts CurrentUserError types', () => {
    const decode = Schema.decodeUnknownEither(OrgRoleError)
    const errors = [
      { _tag: 'UserLoading' },
      { _tag: 'UserDataError', cause: 'Error' },
      { _tag: 'AuthStateLoading' },
      { _tag: 'AuthStateError', cause: 'Auth failed' },
      { _tag: 'NotLoggedIn' },
    ]

    errors.forEach((error) => {
      const result = decode(error)
      expect(Either.isRight(result)).toBe(true)
    })
  })

  test('fails for invalid union member', () => {
    const decode = Schema.decodeUnknownEither(OrgRoleError)
    const error = {
      _tag: 'InvalidError',
    }

    const result = decode(error)

    expect(Either.isLeft(result)).toBe(true)
  })
})
