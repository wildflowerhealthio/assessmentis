import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { ReadonlyUrl } from './ReadonlyUrl'

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
