import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Either, Schema } from 'effect'

import { ReadonlyUrl, UriEncodedOriginUrl } from './ReadonlyUrl'

const readonlyUrlArb = Arbitrary.make(ReadonlyUrl)

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
      const fromStringArb = Arbitrary.make(ReadonlyUrl.FromString)
      fc.assert(
        fc.property(fromStringArb, (url) => {
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
      const fromStringArb = Arbitrary.make(ReadonlyUrl.FromString)
      fc.assert(
        fc.property(fromStringArb, (url) => {
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
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir',
      })
      const resourceUrl = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir/Patient/123',
      })
      expect(origin.hasChild(resourceUrl)).toBe(true)
    })

    test('origin does not haveChild a URL with a different pathname prefix', () => {
      const origin = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir',
      })
      const otherUrl = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/other/Patient/123',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('origin does not haveChild a URL with a different host', () => {
      const origin = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir',
      })
      const otherUrl = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'other.com',
        pathname: '/fhir/Patient/123',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('origin does not haveChild a URL with a different protocol', () => {
      const origin = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir',
      })
      const otherUrl = ReadonlyUrl.make({
        protocol: 'http:',
        host: 'example.com',
        pathname: '/fhir/Patient/123',
      })
      expect(origin.hasChild(otherUrl)).toBe(false)
    })

    test('origin hasChild itself', () => {
      const url = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/fhir',
      })
      expect(url.hasChild(url)).toBe(true)
    })

    test('property: a URL built with appendToPathname is a child of the original', () => {
      const suffixArb = fc.stringOf(
        fc.constantFrom('/', 'a', 'b', '1', '-', '_')
      )
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
        protocol: 'https:',
        host: 'example.com',
        pathname: '/base',
      })
      const result = url.appendToPathname('/extra')
      expect(result.pathname).toBe('/base/extra')
    })

    test('preserves all other fields', () => {
      const url = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/base',
        username: 'user',
        password: 'pass',
      })
      const result = url.appendToPathname('/extra')
      expect(result.protocol).toBe('https:')
      expect(result.host).toBe('example.com')
      expect(result.username).toBe('user')
      expect(result.password).toBe('pass')
    })

    test('returns a new ReadonlyUrl instance', () => {
      const url = ReadonlyUrl.make({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/base',
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

    test('property: appending is equivalent to string concatenation', () => {
      const suffixArb = fc.stringOf(
        fc.constantFrom('/', 'a', 'b', '1', '-', '_')
      )
      fc.assert(
        fc.property(readonlyUrlArb, suffixArb, (url, suffix) => {
          const result = url.appendToPathname(suffix)
          expect(result.pathname).toBe(url.pathname + suffix)
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
    const readonlyUrlArb = Arbitrary.make(ReadonlyUrl.FromString)

    fc.assert(
      fc.property(readonlyUrlArb, (url) => {
        const encoded = url.asUriComponent()
        const decode = Schema.decodeUnknownEither(UriEncodedOriginUrl)
        const result = decode(encoded)
        expect(Either.isRight(result)).toBe(true)
      })
    )
  })

  test('property: fromReadonlyUrl matches asUriComponent', () => {
    const readonlyUrlArb = Arbitrary.make(ReadonlyUrl.FromString)

    fc.assert(
      fc.property(readonlyUrlArb, (url) => {
        const encoded = url.asUriComponent()
        expect(encoded).toBe(url.asUriComponent())
      })
    )
  })
})
