import { Effect, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { OrgSlug } from './id-types'
import { Org } from './org'
import { PlatformRoutes } from './platform-urls'
import { UserId } from './user-id'

class TestPlatformRoutes extends PlatformRoutes {
  readonly documentBaseUrl = ReadonlyUrl.make({
    protocol: 'https:',
    host: 'store.example.com',
    pathname: '/v1/main',
  })
  readonly currentUserUrl = ReadonlyUrl.make({
    protocol: 'https:',
    host: 'store.example.com',
    pathname: '/auth/currentUser',
  })
}

const routes = new TestPlatformRoutes()

// Arbitraries include characters that require percent-encoding (.+@! and
// interior spaces) to exercise the ReadonlyUrl.toString() →
// decodeURIComponent() round-trip. '/' is excluded (breaks path segments).
// Leading/trailing whitespace is trimmed because new URL() strips it per
// the WHATWG URL standard — that's a URL-level constraint, not ours.
const idChar = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_.+@! '.split(''))
const slugArb = fc
  .array(idChar, { minLength: 3, maxLength: 10 })
  .map((chars) => OrgSlug.make(chars.join('').trim()))
  .filter((s) => s.length >= 3)
const userIdArb = fc
  .array(idChar, { minLength: 1, maxLength: 20 })
  .map((chars) => UserId.make(chars.join('').trim()))
  .filter((s) => s.length >= 1)

describe('PlatformRoutes', () => {
  describe('orgUrl', () => {
    test('appends org document path to base URL', () => {
      const slug = OrgSlug.make('acme')
      const url = routes.orgUrl(slug)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/orgs/acme')
    })

    test('property: round-trip orgUrl → orgSlugFromUrl', () => {
      fc.assert(
        fc.property(slugArb, (slug) => {
          const url = routes.orgUrl(slug)
          const extracted = Effect.runSync(routes.orgSlugFromUrl(url))
          expect(extracted).toBe(slug)
        })
      )
    })
  })

  describe('userUrl', () => {
    test('appends user document path to base URL', () => {
      const uid = UserId.make('user-123')
      const url = routes.userUrl(uid)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/users/user-123')
    })

    test('property: round-trip userUrl → userIdFromUrl', () => {
      fc.assert(
        fc.property(userIdArb, (uid) => {
          const url = routes.userUrl(uid)
          const extracted = Effect.runSync(routes.userIdFromUrl(url))
          expect(extracted).toBe(uid)
        })
      )
    })
  })

  describe('userOrgUrl', () => {
    test('appends user-org document path to base URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const url = routes.userOrgUrl(uid, slug)
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('store.example.com')
      expect(url.pathname).toContain('/v1/main/users/user-123/orgs/acme')
    })

    test('property: round-trip userOrgUrl → userIdFromUserOrgUrl + orgSlugFromUserOrgUrl', () => {
      fc.assert(
        fc.property(slugArb, userIdArb, (slug, uid) => {
          const url = routes.userOrgUrl(uid, slug)
          expect(Effect.runSync(routes.userIdFromUserOrgUrl(url))).toBe(uid)
          expect(Effect.runSync(routes.orgSlugFromUserOrgUrl(url))).toBe(slug)
        })
      )
    })
  })

  describe('parsers fail on mismatched base URL', () => {
    test('orgSlugFromUrl fails when base does not match', () => {
      const otherRoutes = new (class extends PlatformRoutes {
        readonly documentBaseUrl = ReadonlyUrl.make({
          protocol: 'https:',
          host: 'other.example.com',
          pathname: '/wrong/prefix',
        })
        readonly currentUserUrl = ReadonlyUrl.make({
          protocol: 'https:',
          host: 'other.example.com',
          pathname: '/auth',
        })
      })()
      const url = routes.orgUrl(OrgSlug.make('acme'))
      const exit = Effect.runSyncExit(otherRoutes.orgSlugFromUrl(url))
      expect(exit._tag).toBe('Failure')
    })
  })

  describe('ReadonlyUrl.hasChild', () => {
    test('org URL is a child of the document base URL', () => {
      const url = routes.orgUrl(OrgSlug.make('acme'))
      expect(routes.documentBaseUrl.hasChild(url)).toBe(true)
    })

    test('userOrg URL is a child of the user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = routes.userUrl(uid)
      const uoUrl = routes.userOrgUrl(uid, slug)
      expect(uUrl.hasChild(uoUrl)).toBe(true)
    })

    test('org URL is not a child of a user URL', () => {
      const uid = UserId.make('user-123')
      const slug = OrgSlug.make('acme')
      const uUrl = routes.userUrl(uid)
      const oUrl = routes.orgUrl(slug)
      expect(uUrl.hasChild(oUrl)).toBe(false)
    })

    test('document URL is not a child of the auth base URL', () => {
      const url = routes.orgUrl(OrgSlug.make('acme'))
      expect(routes.currentUserUrl.hasChild(url)).toBe(false)
    })
  })

  describe('UrlSchema round-trip', () => {
    test('Org.UrlSchema decodes and encodes a URL string', () => {
      const url = routes.orgUrl(OrgSlug.make('acme'))
      const urlString = url.toString()
      const decoded = Schema.decodeSync(Org.UrlSchema)(urlString)
      expect(decoded.protocol).toBe('https:')
      expect(decoded.pathname).toContain('orgs/acme')
    })
  })
})
