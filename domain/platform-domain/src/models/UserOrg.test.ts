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

  test('defaults originConfigs to empty object', () => {
    const result = decode({})
    expect(result.originConfigs).toEqual({})
  })

  test('decodes originConfigs with _tag and preserves extra properties', () => {
    const result = decode({
      originConfigs: {
        'https%3A%2F%2Fexample.com': {
          _tag: 'google_user_oauth_token',
          email: 'user@example.com',
        },
      },
    })
    expect(
      result.originConfigs[
        'https%3A%2F%2Fexample.com' as keyof typeof result.originConfigs
      ]
    ).toEqual({ _tag: 'google_user_oauth_token', email: 'user@example.com' })
  })
})
