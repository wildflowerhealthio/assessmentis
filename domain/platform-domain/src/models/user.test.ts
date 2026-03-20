import { Arbitrary, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { OrgSlug } from './id-types'
import { User } from './user'
import { UserId } from './user-id'

const userArb = Arbitrary.make(User)

describe('User', () => {
  const decode = Schema.decodeUnknownSync(User)
  const decodeEither = Schema.decodeUnknownEither(User)
  const encode = Schema.encodeSync(User)

  describe('DomainClass conformance', () => {
    test('has static DomainType', () => {
      expect(User.DomainType).toBe('User')
    })

    test('has static UrlSchema', () => {
      expect(User.UrlSchema).toBeDefined()
    })

    test('has static SearchSchema', () => {
      expect(User.SearchSchema).toEqual({})
    })

    test('decoded instance has domainType', () => {
      const user = decode({ org_roles: {}, uid: 'user-1' })
      expect(user.domainType).toBe('User')
    })

    test('url is undefined when omitted', () => {
      const user = decode({ org_roles: {}, uid: 'user-1' })
      expect(user.url).toBeUndefined()
    })
  })

  describe('roundtrip', () => {
    test('property: encode-decode round-trip preserves value', () => {
      fc.assert(
        fc.property(userArb, (user) => {
          const encoded = encode(user)
          const decoded = decode(encoded)
          const reEncoded = encode(decoded)
          expect(reEncoded).toEqual(encoded)
        })
      )
    })
  })

  describe('required fields', () => {
    test('rejects missing uid', () => {
      const result = decodeEither({ org_roles: {} })
      expect(result._tag).toBe('Left')
    })

    test('rejects missing org_roles', () => {
      const result = decodeEither({ uid: 'user-1' })
      expect(result._tag).toBe('Left')
    })

    test('rejects non-string uid', () => {
      const result = decodeEither({ org_roles: {}, uid: 123 })
      expect(result._tag).toBe('Left')
    })
  })

  describe('optional fields', () => {
    test('lastOrg is undefined when omitted', () => {
      const result = decode({ org_roles: {}, uid: 'user-1' })
      expect(result.lastOrg).toBeUndefined()
    })

    test('accepts lastOrg as string', () => {
      const result = decode({ lastOrg: 'my-org', org_roles: {}, uid: 'user-1' })
      expect(result.lastOrg).toBe('my-org')
    })
  })

  describe('org_roles', () => {
    test('accepts empty org_roles', () => {
      const result = decode({ org_roles: {}, uid: 'user-1' })
      expect(result.org_roles).toEqual({})
    })

    test('accepts org_roles with branded OrgSlug keys', () => {
      const slug = OrgSlug.make('acme')
      const result = decode({
        org_roles: { [slug]: ['admin', 'viewer'] },
        uid: 'user-1',
      })
      expect(Object.keys(result.org_roles)).toHaveLength(1)
    })
  })

  describe('uid is branded UserId', () => {
    test('decoded uid matches input', () => {
      const uid = UserId.make('firebase-uid-abc')
      const result = decode({ org_roles: {}, uid })
      expect(result.uid).toBe(uid)
    })
  })

  describe('cloneWith', () => {
    test('produces a new instance with updated fields', () => {
      const user = decode({ org_roles: {}, uid: 'user-1' })
      const cloned = user.cloneWith({ lastOrg: 'new-org' })
      expect(cloned.lastOrg).toBe('new-org')
      expect(cloned.uid).toBe(user.uid)
    })
  })
})
