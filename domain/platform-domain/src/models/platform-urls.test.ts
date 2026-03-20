import { Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { OrgSlug } from './id-types'
import { Org } from './org'
import {
  orgSlugFromUrl,
  orgSlugFromUserOrgUrl,
  orgUrl,
  userIdFromUrl,
  userIdFromUserOrgUrl,
  userOrgUrl,
  userUrl,
} from './platform-urls'
import type { FirebaseUrlConfig } from './platform-urls'
import { UserId } from './user-id'

const config: FirebaseUrlConfig = {
  projectId: 'my-project',
  databaseId: 'my-db',
}

// URL-safe arbitraries — slugs and user IDs must survive URL round-trips
const urlSafeChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split(''))
const slugArb = fc
  .array(urlSafeChar, { minLength: 3, maxLength: 10 })
  .map((chars) => OrgSlug.make(chars.join('')))
const userIdArb = fc
  .array(urlSafeChar, { minLength: 1, maxLength: 20 })
  .map((chars) => UserId.make(chars.join('')))

describe('platform-urls', () => {
  describe('orgUrl', () => {
    test('produces a firebase:// URL with correct structure', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(config, slug)
      expect(url.protocol).toBe('firebase:')
      expect(url.host).toBe('my-project')
      expect(url.pathname).toContain('/firestore/my-db/orgs/acme')
    })

    test('property: round-trip orgUrl → orgSlugFromUrl', () => {
      fc.assert(
        fc.property(slugArb, (slug) => {
          const url = orgUrl(config, slug)
          const extracted = orgSlugFromUrl(url)
          expect(extracted).toBe(slug)
        })
      )
    })
  })

  describe('userUrl', () => {
    test('produces a firebase:// URL with correct structure', () => {
      const uid = UserId.make('user-123')
      const url = userUrl(config, uid)
      expect(url.protocol).toBe('firebase:')
      expect(url.host).toBe('my-project')
      expect(url.pathname).toContain('/firestore/my-db/users/user-123')
    })

    test('property: round-trip userUrl → userIdFromUrl', () => {
      fc.assert(
        fc.property(userIdArb, (uid) => {
          const url = userUrl(config, uid)
          const extracted = userIdFromUrl(url)
          expect(extracted).toBe(uid)
        })
      )
    })
  })

  describe('userOrgUrl', () => {
    test('produces a firebase:// URL with correct structure', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const url = userOrgUrl(config, uid, slug)
      expect(url.protocol).toBe('firebase:')
      expect(url.host).toBe('my-project')
      expect(url.pathname).toContain('/firestore/my-db/users/user-123/orgs/acme')
    })

    test('property: round-trip userOrgUrl → userIdFromUserOrgUrl + orgSlugFromUserOrgUrl', () => {
      fc.assert(
        fc.property(slugArb, userIdArb, (slug, uid) => {
          const url = userOrgUrl(config, uid, slug)
          expect(userIdFromUserOrgUrl(url)).toBe(uid)
          expect(orgSlugFromUserOrgUrl(url)).toBe(slug)
        })
      )
    })
  })

  describe('ReadonlyUrl.hasChild with firebase:// URLs', () => {
    test('org URL is a child of the firestore root', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(config, slug)
      const root = ReadonlyUrl.make({
        protocol: 'firebase:',
        host: 'my-project',
        pathname: '/firestore/my-db',
      })
      expect(root.hasChild(url)).toBe(true)
    })

    test('userOrg URL is a child of the user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = userUrl(config, uid)
      const uoUrl = userOrgUrl(config, uid, slug)
      expect(uUrl.hasChild(uoUrl)).toBe(true)
    })

    test('org URL is not a child of a user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = userUrl(config, uid)
      const oUrl = orgUrl(config, slug)
      expect(uUrl.hasChild(oUrl)).toBe(false)
    })
  })

  describe('UrlSchema round-trip', () => {
    test('Org.UrlSchema decodes and encodes a firebase:// URL string', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(config, slug)
      const urlString = url.toString()
      const decoded = Schema.decodeSync(Org.UrlSchema)(urlString)
      expect(decoded.protocol).toBe('firebase:')
      expect(decoded.pathname).toContain('orgs/acme')
    })
  })
})
