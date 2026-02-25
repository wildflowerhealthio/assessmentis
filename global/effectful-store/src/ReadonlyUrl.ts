import { Schema, Effect, ParseResult } from 'effect'

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
  // readonly search: Components['search'] extends undefined
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
  static readonly FromString2 = Schema.compose(Schema.URLFromSelf, this)

  static readonly FromString = Schema.transformOrFail(Schema.String, this, {
    strict: true,
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
        return Effect.fail(
          new ParseResult.Forbidden(ast, fromI, 'Invalid URL string')
        )
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
          new ParseResult.Forbidden(ast, toA, 'Cannot encode as URL string')
        )
      }
    },
  }).annotations({
    arbitrary: () => (fc) =>
      fc.webUrl().map((str) => {
        const url = new URL(str)
        return ReadonlyUrl.make({
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          username: url.username,
          password: url.password,
        })
      }),
  })

  appendToPathname(path: string): ReadonlyUrl {
    return ReadonlyUrl.make({
      host: this.host,
      protocol: this.protocol,
      username: this.username,
      password: this.password,
      pathname: `${this.pathname}${path}`,
    })
  }
}
