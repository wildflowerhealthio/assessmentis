import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Either, Schema } from 'effect'

import { CredentialId } from './CredentialId'

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
