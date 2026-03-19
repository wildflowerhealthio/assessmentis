import { Arbitrary, Either, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { ReadonlyUrl, UriEncodedOriginUrl } from './readonly-url'

const readonlyUrlArb = Arbitrary.make(ReadonlyUrl)
const wellFormedUrlArb = Arbitrary.make(ReadonlyUrl.FromString)

describe('ReadonlyUrl', () => {
  describe('base schema', () => {
    test('property: encode-decode round-trip', () => {
      fc.assert(
        fc.property(readonlyUrlArb, (url) => {
          const encoded = Schema.encodeSync(ReadonlyUrl)(url)
          const decoded = Schema.decodeSync(ReadonlyUrl)(encoded)
          expect(decoded).toEqual(url)
        })
      )
    })

    test('all fields default to empty string', () => {
      const url = Schema.decodeSync(ReadonlyUrl)({})
      expect(url.protocol).toBe('')
      expect(url.host).toBe('')
      expect(url.pathname).toBe('')
      expect(url.username).toBe('')
      expect(url.password).toBe('')
    })
  })

  describe('FromString', () => {
    const decode = Schema.decodeSync(ReadonlyUrl.FromString)
    const encode = Schema.encodeSync(ReadonlyUrl.FromString)

    test('decodes a full URL string into ReadonlyUrl fields', () => {
      const url = decode('https://user:pass@example.com:8080/path')
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('example.com:8080')
      expect(url.pathname).toBe('/path')
      expect(url.username).toBe('user')
      expect(url.password).toBe('pass')
    })

    test('decodes a minimal URL string', () => {
      const url = decode('https://example.com')
      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('example.com')
      expect(url.pathname).toBe('/')
      expect(url.username).toBe('')
      expect(url.password).toBe('')
    })

    test('rejects an invalid URL string', () => {
      expect(() => decode('not-a-url')).toThrow()
    })

    test('encodes back to a URL string', () => {
      const url = decode('https://example.com/path')
      const str = encode(url)
      expect(str).toBe('https://example.com/path')
    })

    test('encodes a URL with credentials', () => {
      const url = decode('https://user:pass@example.com/path')
      const str = encode(url)
      expect(str).toBe('https://user:pass@example.com/path')
    })

    test('property: decode-encode round-trip preserves parseable URLs', () => {
      const urlStringArb = fc.webUrl()
      fc.assert(
        fc.property(urlStringArb, (urlStr) => {
          const decoded = decode(urlStr)
          expect(decoded).toBeInstanceOf(ReadonlyUrl)
          expect(decoded.protocol).toBeTruthy()
          expect(decoded.host).toBeTruthy()
        })
      )
    })

    test('property: arbitrary values encode-decode round-trip', () => {
      fc.assert(
        fc.property(wellFormedUrlArb, (url) => {
          const encoded = Schema.encodeSync(ReadonlyUrl.FromString)(url)
          const decoded = Schema.decodeSync(ReadonlyUrl.FromString)(encoded)
          expect(decoded.protocol).toBe(url.protocol)
          expect(decoded.host).toBe(url.host)
          expect(decoded.pathname).toBe(url.pathname)
          expect(decoded.username).toBe(url.username)
          expect(decoded.password).toBe(url.password)
        })
      )
    })

    test('property: arbitrary values are always valid ReadonlyUrl instances', () => {
      fc.assert(
        fc.property(wellFormedUrlArb, (url) => {
          expect(url).toBeInstanceOf(ReadonlyUrl)
          expect(url.protocol).toBeTruthy()
          expect(url.host).toBeTruthy()
        })
      )
    })
  })

  describe('hasChild', () => {
    test('origin hasChild a resource URL under its pathname', () => {
      const origin = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir',
        protocol: 'https:',
      })
      const resourceUrl = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir/Patient/123',
        protocol: 'https:',
      })
      expect(origin.hasChild(resourceUrl)).toBe(true)
    })

    test('origin does not haveChild a URL with a different pathname prefix', () => {
      const origin = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir',
        protocol: 'https:',
      })
      const otherUrl = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/other/Patient/123',
        protocol: 'https:',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('origin does not haveChild a URL with a different host', () => {
      const origin = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir',
        protocol: 'https:',
      })
      const otherUrl = ReadonlyUrl.make({
        host: 'other.com',
        pathname: '/fhir/Patient/123',
        protocol: 'https:',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('origin does not haveChild a URL with a different protocol', () => {
      const origin = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir',
        protocol: 'https:',
      })
      const otherUrl = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/fhir/Patient/123',
        protocol: 'http:',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('property: a ReadonlyUrl always hasChild itself with trailing slashes added or removed', () => {
      const trailingSlashesArb = fc.stringOf(fc.constant('/'))
      fc.assert(
        fc.property(wellFormedUrlArb, trailingSlashesArb, (url, slashes) => {
          const base = url.pathname.replace(/\/+$/, '')
          const variant = ReadonlyUrl.make({
            host: url.host,
            password: url.password,
            pathname: base + slashes,
            protocol: url.protocol,
            username: url.username,
          })
          expect(url.hasChild(variant)).toBe(true)
          expect(variant.hasChild(url)).toBe(true)
        })
      )
    })

    test('property: a ReadonlyUrl never hasChild itself with non-slash characters added or removed', () => {
      const nonSlashSuffixArb = fc.stringOf(fc.constantFrom('a', 'b', 'X', '1', '-', '_'), {
        minLength: 1,
      })
      fc.assert(
        fc.property(wellFormedUrlArb, nonSlashSuffixArb, (url, suffix) => {
          const base = url.pathname.replace(/\/+$/, '')
          const notChild = ReadonlyUrl.make({
            host: url.host,
            password: url.password,
            pathname: base + suffix,
            protocol: url.protocol,
            username: url.username,
          })
          expect(url.hasChild(notChild)).toBe(false)
        })
      )
    })

    test('property: a URL built with appendToPathname is a child of the original', () => {
      const suffixArb = fc.stringOf(fc.constantFrom('/', 'a', 'b', '1', '-', '_'))
      fc.assert(
        fc.property(readonlyUrlArb, suffixArb, (url, suffix) => {
          const child = url.appendToPathname(suffix)
          expect(url.hasChild(child)).toBe(true)
        })
      )
    })
  })

  describe('appendToPathname', () => {
    test('appends a path segment', () => {
      const url = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/base',
        protocol: 'https:',
      })
      const result = url.appendToPathname('/extra')
      expect(result.pathname).toBe('/base/extra')
    })

    test('preserves all other fields', () => {
      const url = ReadonlyUrl.make({
        host: 'example.com',
        password: 'pass',
        pathname: '/base',
        protocol: 'https:',
        username: 'user',
      })
      const result = url.appendToPathname('/extra')
      expect(result.protocol).toBe('https:')
      expect(result.host).toBe('example.com')
      expect(result.username).toBe('user')
      expect(result.password).toBe('pass')
    })

    test('returns a new ReadonlyUrl instance', () => {
      const url = ReadonlyUrl.make({
        host: 'example.com',
        pathname: '/base',
        protocol: 'https:',
      })
      const result = url.appendToPathname('/extra')
      expect(result).toBeInstanceOf(ReadonlyUrl)
      expect(result).not.toBe(url)
    })

    test('property: appending empty string is identity', () => {
      fc.assert(
        fc.property(readonlyUrlArb, (url) => {
          const result = url.appendToPathname('')
          expect(result.pathname).toBe(url.pathname)
          expect(result.host).toBe(url.host)
          expect(result.protocol).toBe(url.protocol)
        })
      )
    })

    test('property: the result of appendToPathname(a string with no double slashes) never has double slashes', () => {
      const noDoubleSlashArb = fc
        .stringOf(fc.constantFrom('/', 'a', 'b', '1', '-', '_'))
        .filter((s) => !s.includes('//'))
      fc.assert(
        fc.property(wellFormedUrlArb, noDoubleSlashArb, (url, suffix) => {
          const result = url.appendToPathname(suffix)
          expect(result.pathname).not.toContain('//')
        })
      )
    })

    test('property: appendToPathname(a string with no double slashes) on a ReadonlyUrl with a trailing slash never has a doubled slash', () => {
      const noDoubleSlashArb = fc
        .stringOf(fc.constantFrom('/', 'a', 'b', '1', '-', '_'))
        .filter((s) => !s.includes('//'))
      const trailingSlashUrlArb = wellFormedUrlArb.map((url) => {
        const base = url.pathname.replace(/\/+$/, '')
        return ReadonlyUrl.make({
          host: url.host,
          password: url.password,
          pathname: base + '/',
          protocol: url.protocol,
          username: url.username,
        })
      })
      fc.assert(
        fc.property(trailingSlashUrlArb, noDoubleSlashArb, (url, suffix) => {
          const result = url.appendToPathname(suffix)
          expect(result.pathname).not.toContain('//')
        })
      )
    })

    test('property: url.appendToPathname(x) always equals url.appendToPathname(x with any number of leading slashes)', () => {
      const leadingSlashesArb = fc.stringOf(fc.constant('/'), { minLength: 1 })
      const pathSuffixArb = fc.stringOf(fc.constantFrom('a', 'b', '1', '-', '_', '/'))
      fc.assert(
        fc.property(wellFormedUrlArb, leadingSlashesArb, pathSuffixArb, (url, slashes, suffix) => {
          const withoutLeading = url.appendToPathname(suffix)
          const withLeading = url.appendToPathname(slashes + suffix)
          expect(withLeading.pathname).toBe(withoutLeading.pathname)
        })
      )
    })
  })
})

describe('UriEncodedOriginUrl', () => {
  test('property: decode-encode cycle preserves string values', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const decode = Schema.decodeUnknownEither(UriEncodedOriginUrl)
        const encode = Schema.encodeUnknownEither(UriEncodedOriginUrl)

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

  test('property: fromReadonlyUrl produces a valid UriEncodedOriginUrl', () => {
    fc.assert(
      fc.property(wellFormedUrlArb, (url) => {
        const encoded = url.asUriComponent()
        const decode = Schema.decodeUnknownEither(UriEncodedOriginUrl)
        const result = decode(encoded)
        expect(Either.isRight(result)).toBe(true)
      })
    )
  })

  test('property: fromReadonlyUrl matches asUriComponent', () => {
    fc.assert(
      fc.property(wellFormedUrlArb, (url) => {
        const encoded = url.asUriComponent()
        expect(encoded).toBe(url.asUriComponent())
      })
    )
  })
})
