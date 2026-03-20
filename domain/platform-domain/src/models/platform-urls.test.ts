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
import { UserId } from './user-id'

const baseUrl = ReadonlyUrl.make({
  protocol: 'https:',
  host: 'store.example.com',
  pathname: '/v1/main',
})

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
    test('appends org document path to base URL', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(baseUrl, slug)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/orgs/acme')
    })

    test('property: round-trip orgUrl → orgSlugFromUrl', () => {
      fc.assert(
        fc.property(slugArb, (slug) => {
          const url = orgUrl(baseUrl, slug)
          const extracted = orgSlugFromUrl(baseUrl, url)
          expect(extracted).toBe(slug)
        })
      )
    })
  })

  describe('userUrl', () => {
    test('appends user document path to base URL', () => {
      const uid = UserId.make('user-123')
      const url = userUrl(baseUrl, uid)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/users/user-123')
    })

    test('property: round-trip userUrl → userIdFromUrl', () => {
      fc.assert(
        fc.property(userIdArb, (uid) => {
          const url = userUrl(baseUrl, uid)
          const extracted = userIdFromUrl(baseUrl, url)
          expect(extracted).toBe(uid)
        })
      )
    })
  })

  describe('userOrgUrl', () => {
    test('appends user-org document path to base URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const url = userOrgUrl(baseUrl, uid, slug)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/users/user-123/orgs/acme')
    })

    test('property: round-trip userOrgUrl → userIdFromUserOrgUrl + orgSlugFromUserOrgUrl', () => {
      fc.assert(
        fc.property(slugArb, userIdArb, (slug, uid) => {
          const url = userOrgUrl(baseUrl, uid, slug)
          expect(userIdFromUserOrgUrl(baseUrl, url)).toBe(uid)
          expect(orgSlugFromUserOrgUrl(baseUrl, url)).toBe(slug)
        })
      )
    })
  })

  describe('ReadonlyUrl.hasChild', () => {
    test('org URL is a child of the base URL', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(baseUrl, slug)
      expect(baseUrl.hasChild(url)).toBe(true)
    })

    test('userOrg URL is a child of the user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = userUrl(baseUrl, uid)
      const uoUrl = userOrgUrl(baseUrl, uid, slug)
      expect(uUrl.hasChild(uoUrl)).toBe(true)
    })

    test('org URL is not a child of a user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = userUrl(baseUrl, uid)
      const oUrl = orgUrl(baseUrl, slug)
      expect(uUrl.hasChild(oUrl)).toBe(false)
    })
  })

  describe('UrlSchema round-trip', () => {
    test('Org.UrlSchema decodes and encodes a URL string', () => {
      const slug = OrgSlug.make('acme')
      const url = orgUrl(baseUrl, slug)
      const urlString = url.toString()
      const decoded = Schema.decodeSync(Org.UrlSchema)(urlString)
      expect(decoded.protocol).toBe('https:')
      expect(decoded.pathname).toContain('orgs/acme')
    })
  })
})
