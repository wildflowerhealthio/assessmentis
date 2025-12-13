import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import {
  UserId,
  AuthStateError,
  AuthStateLoading,
  NotLoggedIn,
  CurrentUserIdError,
} from './UserId'

describe('UserId', () => {
  test('creates branded string for valid user ID', () => {
    const decode = Schema.decodeUnknownEither(UserId)
    const result = decode('user-123')

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toBe('user-123')
    }
  })

  test('accepts UUID format', () => {
    const decode = Schema.decodeUnknownEither(UserId)
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    const result = decode(uuid)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toBe(uuid)
    }
  })

  test('fails for non-string values', () => {
    const decode = Schema.decodeUnknownEither(UserId)
    const result = decode(12345)

    expect(Either.isLeft(result)).toBe(true)
  })
})

describe('AuthStateError', () => {
  test('creates error with cause', () => {
    const encode = Schema.encodeUnknownEither(AuthStateError)
    const error = {
      _tag: 'AuthStateError',
      cause: new Error('Authentication failed'),
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateError')
    }
  })

  test('creates error without cause', () => {
    const encode = Schema.encodeUnknownEither(AuthStateError)
    const error = {
      _tag: 'AuthStateError',
    }

    const result = encode(error)

    expect(Either.isRight(result)).toBe(true)
  })

  test('decodes error with cause', () => {
    const decode = Schema.decodeUnknownEither(AuthStateError)
    const error = {
      _tag: 'AuthStateError',
      cause: 'Connection timeout',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateError')
      expect(result.right.cause).toBe('Connection timeout')
    }
  })
})

describe('AuthStateLoading', () => {
  test('creates loading state', () => {
    const encode = Schema.encodeUnknownEither(AuthStateLoading)
    const loading = {
      _tag: 'AuthStateLoading',
    }

    const result = encode(loading)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateLoading')
    }
  })

  test('decodes loading state', () => {
    const decode = Schema.decodeUnknownEither(AuthStateLoading)
    const loading = {
      _tag: 'AuthStateLoading',
    }

    const result = decode(loading)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateLoading')
    }
  })
})

describe('NotLoggedIn', () => {
  test('creates not logged in state', () => {
    const encode = Schema.encodeUnknownEither(NotLoggedIn)
    const notLoggedIn = {
      _tag: 'NotLoggedIn',
    }

    const result = encode(notLoggedIn)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NotLoggedIn')
    }
  })

  test('decodes not logged in state', () => {
    const decode = Schema.decodeUnknownEither(NotLoggedIn)
    const notLoggedIn = {
      _tag: 'NotLoggedIn',
    }

    const result = decode(notLoggedIn)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NotLoggedIn')
    }
  })
})

describe('CurrentUserIdError', () => {
  test('accepts AuthStateLoading', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserIdError)
    const error = {
      _tag: 'AuthStateLoading',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateLoading')
    }
  })

  test('accepts AuthStateError', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserIdError)
    const error = {
      _tag: 'AuthStateError',
      cause: 'Network error',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('AuthStateError')
    }
  })

  test('accepts NotLoggedIn', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserIdError)
    const error = {
      _tag: 'NotLoggedIn',
    }

    const result = decode(error)

    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right._tag).toBe('NotLoggedIn')
    }
  })

  test('fails for invalid union member', () => {
    const decode = Schema.decodeUnknownEither(CurrentUserIdError)
    const error = {
      _tag: 'InvalidTag',
    }

    const result = decode(error)

    expect(Either.isLeft(result)).toBe(true)
  })
})
