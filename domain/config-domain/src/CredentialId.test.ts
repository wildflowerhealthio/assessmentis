import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Either, Option, Schema } from 'effect'

import {
  CredentialId,
  makeCredentialId,
  parseCredentialId,
} from './CredentialId'

describe('CredentialId', () => {
  test('property: decode-encode cycle preserves string values', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const decode = Schema.decodeUnknownEither(CredentialId)
        const encode = Schema.encodeUnknownEither(CredentialId)

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

  test('decoded value carries the CredentialId brand', () => {
    const decode = Schema.decodeUnknownSync(CredentialId)
    const value = decode('test-credential')
    expect(typeof value).toBe('string')
    // Brand is structural — verify the value is accepted by encode
    const encode = Schema.encodeUnknownSync(CredentialId)
    expect(encode(value)).toBe('test-credential')
  })

  test('property: non-string values always fail to decode', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.integer(), fc.boolean(), fc.object(), fc.constant(null)),
        (value) => {
          const decode = Schema.decodeUnknownEither(CredentialId)
          const result = decode(value)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })
})

describe('makeCredentialId', () => {
  test('produces tag:key format', () => {
    const id = makeCredentialId('my_tag', 'my_key')
    expect(id).toBe('my_tag:my_key')
  })

  test('throws when tag contains ":"', () => {
    expect(() => makeCredentialId('bad:tag', 'key')).toThrow(
      /must not contain ':'/
    )
  })

  test('property: round-trips with parseCredentialId for colon-free tags', () => {
    const colonFreeString = fc.string().filter((s) => !s.includes(':'))
    fc.assert(
      fc.property(colonFreeString, fc.string(), (tag, key) => {
        const id = makeCredentialId(tag, key)
        const parsed = parseCredentialId(id)
        expect(Option.isSome(parsed)).toBe(true)
        if (Option.isSome(parsed)) {
          expect(parsed.value.tag).toBe(tag)
          expect(parsed.value.key).toBe(key)
        }
      })
    )
  })
})

describe('parseCredentialId', () => {
  test('parses a valid credential ID', () => {
    const result = parseCredentialId('google_user_oauth_token:user@example.com')
    expect(Option.isSome(result)).toBe(true)
    if (Option.isSome(result)) {
      expect(result.value.tag).toBe('google_user_oauth_token')
      expect(result.value.key).toBe('user@example.com')
    }
  })

  test('returns None for strings without a colon', () => {
    expect(Option.isNone(parseCredentialId('no-colon-here'))).toBe(true)
  })

  test('splits on the first colon only', () => {
    const result = parseCredentialId('tag:key:with:colons')
    expect(Option.isSome(result)).toBe(true)
    if (Option.isSome(result)) {
      expect(result.value.tag).toBe('tag')
      expect(result.value.key).toBe('key:with:colons')
    }
  })
})
