import { describe, expect, test } from 'vitest'
import { Arbitrary, FastCheck as fc, Schema } from 'effect'

import { UserOrg } from './UserOrg'

describe('UserOrg', () => {
  const decode = Schema.decodeUnknownSync(UserOrg)
  const encode = Schema.encodeSync(UserOrg)

  test('property: decode-encode round-trip', () => {
    const arb = Arbitrary.make(UserOrg)
    fc.assert(
      fc.property(arb, (userOrg) => {
        const encoded = encode(userOrg)
        const decoded = decode(encoded)
        expect(decoded).toEqual(userOrg)
      })
    )
  })

  test('defaults originConfig to empty object', () => {
    const result = decode({})
    expect(result.originConfig).toEqual({})
  })

  test('decodes originConfig with _tag and preserves extra properties', () => {
    const result = decode({
      originConfig: {
        'https%3A%2F%2Fexample.com': {
          _tag: 'google_user_oauth_token',
          email: 'user@example.com',
        },
      },
    })
    expect(
      result.originConfig[
        'https%3A%2F%2Fexample.com' as keyof typeof result.originConfig
      ]
    ).toEqual({ _tag: 'google_user_oauth_token', email: 'user@example.com' })
  })
})
