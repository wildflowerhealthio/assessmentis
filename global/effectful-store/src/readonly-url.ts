import { SafeRecordKey } from '@assessmentis/util'
import { Effect, ParseResult, Schema } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

/**
 * Immutable, Schema-aware URL representation. Decomposes a URL into its
 * constituent parts (protocol, host, pathname, username, password) and
 * provides structural comparison and path-based child detection.
 *
 * @remarks
 * Unlike the built-in `URL`, `ReadonlyUrl` is a pure value object with no
 * mutable setters. It integrates with Effect's Schema system via
 * {@link ReadonlyUrl.FromString} for parsing/encoding, and carries an
 * `arbitrary` annotation for property-based testing.
 */
export class ReadonlyUrl extends Schema.Class<ReadonlyUrl>('ReadonlyUrl')({
  /**
   * The protocol portion of the URL.
   */
  protocol: Schema.String.pipe(Schema.optionalWith({ default: () => '' })),
  /**
   * Gets and sets the host portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://example.org:81/foo');
   * console.log(myURL.host);
   * // Prints example.org:81
   *
   * myURL.host = 'example.com:82';
   * console.log(myURL.href);
   * // Prints https://example.com:82/foo
   * ```
   *
   * Invalid host values assigned to the `host` property are ignored.
   */
  host: Schema.String.pipe(Schema.optionalWith({ default: () => '' })),
  /**
   * Gets and sets the path portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://example.org/abc/xyz?123');
   * console.log(myURL.pathname);
   * // Prints /abc/xyz
   *
   * myURL.pathname = '/abcdef';
   * console.log(myURL.href);
   * // Prints https://example.org/abcdef?123
   * ```
   *
   * Invalid URL characters included in the value assigned to the `pathname` property are `percent-encoded`. The selection of which characters
   * to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  pathname: Schema.String.pipe(Schema.optionalWith({ default: () => '' })),
  /**
   * The serialized query portion of the URL.
   *
   * Any invalid URL characters appearing in the value assigned the `search` property will be `percent-encoded`. The selection of which
   * characters to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  // Readonly search: Components['search'] extends undefined
  //   ? string
  //   : Components['search']
  /**
   * The username portion of the URL.
   *
   * Any invalid URL characters appearing in the value assigned the `username` property will be `percent-encoded`. The selection of which
   * characters to percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  username: Schema.String.pipe(Schema.optionalWith({ default: () => '' })),
  /**
   * Gets and sets the password portion of the URL.
   *
   * ```js
   * const myURL = new URL('https://abc:xyz@example.com');
   * console.log(myURL.password);
   * // Prints xyz
   *
   * myURL.password = '123';
   * console.log(myURL.href);
   * // Prints https://abc:123@example.com/
   * ```
   *
   * Invalid URL characters included in the value assigned to the `password` property
   * are `percent-encoded`. The selection of which characters to
   * percent-encode may vary somewhat from what the {@link parse} and {@link format} methods would produce.
   */
  password: Schema.String.pipe(Schema.optionalWith({ default: () => '' })),
}) {
  /**
   * Schema that decodes a raw URL string into a `ReadonlyUrl` and encodes
   * back to a normalized `href` string. Fails with `ParseResult.Forbidden`
   * on invalid input.
   */
  static readonly FromString = Schema.transformOrFail(Schema.String, this, {
    decode(
      _fromA: string,
      _opts,
      ast,
      fromI: string
    ): Effect.Effect<ReadonlyUrl, ParseResult.ParseIssue> {
      let url: URL
      try {
        url = new URL(fromI)
      } catch {
        return Effect.fail(new ParseResult.Forbidden(ast, fromI, 'Invalid URL string'))
      }
      return Effect.succeed(
        ReadonlyUrl.make({
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          username: url.username,
          password: url.password,
        })
      )
    },
    encode(
      _toI: typeof ReadonlyUrl.Encoded,
      _opts,
      ast,
      toA: typeof ReadonlyUrl.Type
    ): Effect.Effect<string, ParseResult.ParseIssue> {
      try {
        const url = new URL(`${toA.protocol}//${toA.host}${toA.pathname}`)
        url.username = toA.username
        url.password = toA.password
        return Effect.succeed(url.href)
      } catch {
        return Effect.fail(
          new ParseResult.Forbidden(ast, toA, `Cannot encode as URL string ${JSON.stringify(toA)} `)
        )
      }
    },
    strict: true,
  }).annotations({
    arbitrary: (): Arbitrary.LazyArbitrary<ReadonlyUrl> => (fc: typeof FastCheck) =>
      fc.webUrl().map((str) => {
        const url = new URL(str)
        return ReadonlyUrl.make({
          host: url.host,
          password: url.password,
          pathname: url.pathname,
          protocol: url.protocol,
          username: url.username,
        })
      }),
  })

  /** Decodes a URI-encoded URL string and parses it into a `ReadonlyUrl`. */
  static fromEncoded(encoded: string): ReadonlyUrl {
    const decoded = decodeURIComponent(encoded)
    return Schema.decodeSync(this.FromString)(decoded)
  }

  /**
   * Returns `true` if `otherUrl` is a child of this URL — same protocol and
   * host, with a pathname that starts with this URL's pathname.
   */
  hasChild(otherUrl: ReadonlyUrl): boolean {
    return (
      this.protocol === otherUrl.protocol &&
      this.host === otherUrl.host &&
      otherUrl.pathname.startsWith(this.pathname)
    )
  }

  /** Reconstructs the full URL `href` string from component parts. */
  toString(): string {
    const url = new URL(`${this.protocol}//${this.host}${this.pathname}`)
    url.username = this.username
    url.password = this.password
    return url.href
  }

  /** Returns this URL as a {@link UriEncodedOriginUrl} (percent-encoded string). */
  asUriComponent(): UriEncodedOriginUrl {
    return UriEncodedOriginUrl.make(encodeURIComponent(this.toString()))
  }

  /** Returns a new `ReadonlyUrl` with `path` appended to the pathname. */
  appendToPathname(path: string): ReadonlyUrl {
    return ReadonlyUrl.make({
      host: this.host,
      password: this.password,
      pathname: `${this.pathname}${path}`,
      protocol: this.protocol,
      username: this.username,
    })
  }
}

/**
 * Branded string representing a percent-encoded URL, suitable for use as a
 * HashMap key or URL path segment.
 */
export const UriEncodedOriginUrl = SafeRecordKey.pipe(
  Schema.brand('UriEncodedOriginUrl')
).annotations({
  arbitrary:
    (): Arbitrary.LazyArbitrary<typeof UriEncodedOriginUrl.Type> => (fc: typeof FastCheck) =>
      fc.webUrl().map((str) => {
        const url = new URL(str)
        const readonlyUrl = ReadonlyUrl.make({
          host: url.host,
          password: url.password,
          pathname: url.pathname,
          protocol: url.protocol,
          username: url.username,
        })
        return UriEncodedOriginUrl.make(readonlyUrl.asUriComponent())
      }),
})
export type UriEncodedOriginUrl = typeof UriEncodedOriginUrl.Type
