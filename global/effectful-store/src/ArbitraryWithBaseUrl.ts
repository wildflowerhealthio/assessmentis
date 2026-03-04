import type { Schema } from 'effect'
import { Arbitrary } from 'effect'
import type { ReadonlyUrl } from './ReadonlyUrl'

/**
 * Creates a fast-check arbitrary that generates instances of a domain schema
 * with URLs rooted under a given base URL.
 *
 * Needed for FHIR round-trip tests where the encode step validates that URLs
 * start with the base URL.
 */
export const ArbitraryWithFhirBaseUrl =
  <A extends { readonly url?: ReadonlyUrl | undefined }, I, R>(
    schema: Schema.Schema<A, I, R> & {
      readonly UrlSchema: { readonly make: (url: ReadonlyUrl) => A['url'] & {} }
      readonly DomainType: string
      readonly make: (input: A) => A
    },
    base: ReadonlyUrl,
    allowUndefined: boolean = false
  ): Arbitrary.LazyArbitrary<A> =>
  (fc) => {
    return fc
      .tuple(
        Arbitrary.make(schema),
        fc.webFragments().filter((s) => s !== '' && s !== '.' && s !== '..')
      )
      .map(([value, id]) =>
        schema.make({
          ...value,
          url:
            !allowUndefined || value.url
              ? schema.UrlSchema.make(
                  base.appendToPathname(
                    `/${schema.DomainType}/${encodeURIComponent(id)}`
                  )
                )
              : undefined,
        })
      )
  }
