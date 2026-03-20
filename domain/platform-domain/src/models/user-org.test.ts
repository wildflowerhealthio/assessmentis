import { Arbitrary, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { UserOrg } from './user-org'

describe('UserOrg', () => {
  const decode = Schema.decodeUnknownSync(UserOrg)
  const encode = Schema.encodeSync(UserOrg)

  describe('DomainClass conformance', () => {
    test('has static DomainType', () => {
      expect(UserOrg.DomainType).toBe('UserOrg')
    })

    test('has static UrlSchema', () => {
      expect(UserOrg.UrlSchema).toBeDefined()
    })

    test('has static SearchSchema', () => {
      expect(UserOrg.SearchSchema).toEqual({})
    })

    test('decoded instance has domainType', () => {
      const userOrg = decode({})
      expect(userOrg.domainType).toBe('UserOrg')
    })

    test('url is undefined when omitted', () => {
      const userOrg = decode({})
      expect(userOrg.url).toBeUndefined()
    })
  })

  test('property: decode-encode round-trip', () => {
    const arb = Arbitrary.make(UserOrg)
    fc.assert(
      fc.property(arb, (userOrg) => {
        const encoded = encode(userOrg)
        const decoded = decode(encoded)
        const reEncoded = encode(decoded)
        expect(reEncoded).toEqual(encoded)
      })
    )
  })

  test('defaults originUserConfigs to empty object', () => {
    const result = decode({})
    expect(result.originUserConfigs).toEqual({})
  })

  test('decodes originUserConfigs with _tag and preserves extra properties', () => {
    const result = decode({
      originUserConfigs: {
        'https%3A%2F%2Fexample.com': {
          _tag: 'google_user_oauth_token',
          email: 'user@example.com',
        },
      },
    })
    expect(
      result.originUserConfigs['https%3A%2F%2Fexample.com' as keyof typeof result.originUserConfigs]
    ).toEqual({ _tag: 'google_user_oauth_token', email: 'user@example.com' })
  })

  describe('cloneWith', () => {
    test('produces a new instance with updated fields', () => {
      const userOrg = decode({
        originUserConfigs: {
          'https%3A%2F%2Fexample.com': {
            _tag: 'test',
          },
        },
      })
      const cloned = userOrg.cloneWith({ originUserConfigs: {} })
      expect(cloned.originUserConfigs).toEqual({})
    })
  })
})
