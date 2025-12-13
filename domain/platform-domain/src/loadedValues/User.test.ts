import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import { User, UserLoading, UserDataError, CurrentUserError } from './User'

describe('User', () => {
  test('decodes valid user structure', () => {
    const decode = Schema.decodeUnknownEither(User)
    const user = {
      uid: 'user-123',
      org_roles: {
        'org-1': ['admin', 'editor'],
        'org-2': ['viewer'],
      },
    }

    const result = decode(user)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.uid).toBe('user-123')
      expect(result.right.org_roles['org-1']).toContain('admin')
      expect(result.right.org_roles['org-2']).toContain('viewer')
    }
  })

  test('accepts user with no org roles', () => {
    const decode = Schema.decodeUnknownEither(User)
    const user = {
      uid: 'user-456',
      org_roles: {},
    }

    const result = decode(user)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.uid).toBe('user-456')
      expect(Object.keys(result.right.org_roles)).toHaveLength(0)
    }
  })

  test('accepts user with multiple roles in one org', () => {
    const decode = Schema.decodeUnknownEither(User)
    const user = {
      uid: 'user-789',
      org_roles: {
        'my-org': ['admin', 'editor', 'viewer', 'owner'],
      },
    }

    const result = decode(user)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.org_roles['my-org']).toHaveLength(4)
    }
  })

  test('fails without uid', () => {
    const decode = Schema.decodeUnknownEither(User)
    const user = {
      org_roles: {
        'org-1': ['admin'],
      },
    }

    const result = decode(user)

    expect(Either.isLeft(result)).toBe(true)
  })

  test('fails without org_roles', () => {
    const decode = Schema.decodeUnknownEither(User)
    const user = {
      uid: 'user-123',
    }

    const result = decode(user)

    expect(Either.isLeft(result)).toBe(true)
  })
})

describe('UserLoading', () => {
  test('creates user loading state', () => {
    const encode = Schema.encodeUnknownEither(UserLoading)
    const loading = {
      _tag: 'UserLoading',
    }

    const result = encode(loading)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('UserLoading')
    }
  })

  test('decodes user loading state', () => {
    const decode = Schema.decodeUnknownEither(UserLoading)
    const loading = {
      _tag: 'UserLoading',
    }

    const result = decode(loading)

    expect(Either.isRight(result)).toBe(true)
  })
})

describe('UserDataError', () => {
  test('creates error with cause', () => {
    const encode = Schema.encodeUnknownEither(UserDataError)
    const error = {
      _tag: 'UserDataError',
      cause: 'Database connection failed',
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('UserDataError')
      expect(result.right.cause).toBe('Database connection failed')
    }
  })

  test('creates error without cause', () => {
    const encode = Schema.encodeUnknownEither(UserDataError)
    const error = {
      _tag: 'UserDataError',
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
  })
})

describe('CurrentUserError', () => {
  test('accepts UserLoading', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserError)
    const error = {
      _tag: 'UserLoading',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('UserLoading')
    }
  })

  test('accepts UserDataError', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserError)
    const error = {
      _tag: 'UserDataError',
      cause: 'Parse error',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('UserDataError')
    }
  })

  test('accepts CurrentUserIdError types', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserError)
    const errors = [
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
    const decode = Schema.decodeUnknownEither(CurrentUserError)
    const error = {
      _tag: 'InvalidErrorType',
    }

    const result = decode(error)

    expect(Either.isLeft(result)).toBe(true)
  })
})
