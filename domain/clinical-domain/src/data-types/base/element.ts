import { Schema, pipe } from 'effect'
import type { Arbitrary, Brand, FastCheck } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

import { Extension } from '../special-purpose/extension'
import type { ExtensionEncoded } from '../special-purpose/extension'

// Re-export so barrel consumers that previously got Extension from ./base
// Continue to resolve. Note: special-purpose/index.ts also re-exports
// Extension; the base/index.ts barrel should NOT re-export Extension to
// Avoid duplicate-export ambiguity in data-types/index.ts.

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

const fields = {
  extension: pipe(
    Schema.Array(Extension),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<readonly Extension[]> => (fc: typeof FastCheck) =>
        fc.constant([]),
    }),
    Schema.optionalWith({
      default: (): readonly Extension[] => [],
    })
  ),
} as const satisfies Schema.Struct.Fields

/**
 * The Schema field definitions produced by {@link Element} for a given domain
 * type: `domainType` (defaulted literal), `url` (branded), and `extension`.
 *
 * @typeParam TDomainType - The literal domain type string
 */
export type ElementFields<TDomainType extends string> = typeof fields & {
  domainType: Schema.optionalWith<Schema.Literal<[TDomainType]>, { default: () => TDomainType }>
  url: Schema.optionalWith<
    Schema.UndefinedOr<Schema.brand<Schema.Schema<ReadonlyUrl, string>, `${TDomainType}/url`>>,
    { default: () => undefined }
  >
}

type ElementClass<Self, TDomainType extends string> = {
  readonly DomainType: TDomainType
  readonly UrlSchema: Schema.brand<Schema.Schema<ReadonlyUrl, string>, `${TDomainType}/url`>
} & Schema.Class<
  Self,
  ElementFields<TDomainType>,
  Schema.Struct.Encoded<ElementFields<TDomainType>>,
  Schema.Struct.Context<ElementFields<TDomainType>>,
  Schema.Struct.Constructor<ElementFields<TDomainType>>,
  object,
  object
>

/**
 * Factory that returns an Element mixin class for a given domain type.
 *
 * The returned class provides `domainType` (a defaulted literal), an optional
 * branded `url`, and an `extension` array. It also exposes `DomainType` and
 * `UrlSchema` statics for downstream use.
 *
 * @typeParam TDomainType - The literal domain type string (e.g. `'Patient'`)
 * @param domainType - The domain type string literal
 * @returns A Schema.Class mixin to compose via `.extend`
 *
 * @remarks
 * Both a factory function and a same-name type alias coexist via declaration
 * merging: `Element<'Patient'>` gives the decoded type while
 * `Element('Patient')` gives the mixin class.
 */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- Self type parameter is the locally-defined class; cannot be named externally
export const Element = <TDomainType extends string>(domainType: TDomainType) => {
  const urlSchema = pipe(ReadonlyUrl.FromString, Schema.brand(`${domainType}/url`))

  class ElementMixin extends Schema.Class<ElementMixin>('Element')({
    domainType: Schema.Literal(domainType).pipe(
      Schema.optionalWith({
        default: (): TDomainType => domainType,
      })
    ),
    url: pipe(
      Schema.UndefinedOr(urlSchema),
      Schema.annotations({
        arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
          fc.constant(undefined),
      }),
      Schema.optionalWith({ default: () => undefined })
    ),
    ...fields,
  }) {
    static DomainType = domainType
    static UrlSchema = urlSchema
  }

  return ElementMixin satisfies ElementClass<ElementMixin, TDomainType> as ElementClass<
    ElementMixin,
    TDomainType
  >
}

/** Decoded shape of an Element — the base building block for all FHIR types. */
export interface Element<TDomainType extends string> {
  readonly domainType: TDomainType
  readonly url: (ReadonlyUrl & Brand.Brand<`${TDomainType}/url`>) | undefined
  readonly extension: ReadonlyArray<Extension>
}

/** Encoded (wire-format) shape of an Element. */
export interface ElementEncoded<TDomainType extends string> {
  readonly domainType?: TDomainType | undefined
  readonly url?: string | undefined
  readonly extension?: readonly ExtensionEncoded[] | undefined
}
