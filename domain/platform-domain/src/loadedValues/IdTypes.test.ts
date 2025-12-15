import { expect, test, describe } from 'vitest'
import { Schema, Either, Arbitrary } from 'effect'
import { OrgSlug, Role } from './IdTypes'
import * as fc from 'fast-check'

describe('IdTypes', () => {
  describe('OrgSlug', () => {
    test('property: decode-encode cycle preserves all string values', () => {
      // Property: For any string, if it decodes successfully, encoding the result should return the original string
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(OrgSlug)
          const encode = Schema.encodeUnknownEither(OrgSlug)

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

    test('property: decoding generates branded type with correct value', () => {
      // Property: Any valid string that decodes should maintain its value in the branded type
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(OrgSlug)
          const result = decode(str)

          if (Either.isRight(result)) {
            // The branded type should preserve the original string value
            expect(result.right).toBe(str)
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
            const decode = Schema.decodeUnknownEither(OrgSlug)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })

    test('property: encode is inverse of decode for any string', () => {
      // Property: decode(encode(x)) === x for any valid decoded value
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(OrgSlug)
          const encode = Schema.encodeUnknownEither(OrgSlug)

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

  describe('Role', () => {
    test('property: decode-encode cycle preserves all string values', () => {
      // Property: For any string, if it decodes successfully, encoding the result should return the original string
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(Role)
          const encode = Schema.encodeUnknownEither(Role)

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

    test('property: decoding generates branded type with correct value', () => {
      // Property: Any valid string that decodes should maintain its value in the branded type
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(Role)
          const result = decode(str)

          if (Either.isRight(result)) {
            // The branded type should preserve the original string value
            expect(result.right).toBe(str)
          }
        })
      )
    })

    test('property: non-string values always fail to decode', () => {
      // Property: Any non-string value should fail to decode
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.string()), fc.constant(null)),
          (value) => {
            const decode = Schema.decodeUnknownEither(Role)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })

    test('property: encode is inverse of decode for any string', () => {
      // Property: decode(encode(x)) === x for any valid decoded value
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(Role)
          const encode = Schema.encodeUnknownEither(Role)

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
})
