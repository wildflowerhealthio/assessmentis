import { Schema, pipe } from 'effect'
import type { Arbitrary, Brand, FastCheck } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { AnnotateArrayWithArbitrary, PermissivePassthrough } from '@assessmentis/util'

import { Code } from '../complex/code'
import { Extension } from '../special-purpose/extension'
import type { ExtensionEncoded } from '../special-purpose/extension'
import { Narrative } from '../special-purpose/narrative'
import { Meta } from './meta'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Decoded shape of a FHIR DomainResource — the base type for all clinical
 * resources. Includes meta, text, contained resources, and extensions.
 *
 * @typeParam TDomainType - The literal domain type string (e.g. `'Patient'`)
 */
export interface Resource<TDomainType extends string> {
  readonly domainType: TDomainType
  readonly url: (ReadonlyUrl & Brand.Brand<`${TDomainType}/url`>) | undefined
  readonly meta?: typeof Meta.Type
  readonly implicitRules?: URL
  readonly language?: typeof Code.Type
  readonly text?: typeof Narrative.Type
  readonly contained: ReadonlyArray<unknown>
  readonly extension: ReadonlyArray<Extension>
  readonly modifierExtension: ReadonlyArray<Extension>
}

/** Encoded (wire-format) shape of a Resource. */
export interface ResourceEncoded<TDomainType extends string> {
  readonly domainType?: TDomainType | undefined
  readonly url?: string | undefined
  readonly meta?: typeof Meta.Encoded | undefined
  readonly implicitRules?: string | undefined
  readonly language?: typeof Code.Encoded | undefined
  readonly text?: typeof Narrative.Encoded | undefined
  readonly contained?: readonly unknown[] | undefined
  readonly extension?: readonly ExtensionEncoded[] | undefined
  readonly modifierExtension?: readonly ExtensionEncoded[] | undefined
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const resourceFields = {
  /**
   * Metadata about the resource
   */
  meta: Schema.optional(Meta),
  /**
   * A set of rules under which this content was created
   */
  implicitRules: Schema.optional(Schema.URL),
  /**
   * Language of the resource content
   */
  language: Schema.optional(Code),
  /**
   * Text summary of the resource, for human interpretation
   */
  text: Schema.optional(Narrative),
  /**
   * Contained, inline Resources
   */
  // TODO: type contained resources when needed — Schema.Any passes anything through unvalidated
  contained: Schema.Array(PermissivePassthrough).pipe(
    AnnotateArrayWithArbitrary({ maxLength: 0 }),
    Schema.optionalWith({
      default: (): readonly unknown[] => [],
    })
  ),
  /**
   * Additional content defined by implementations
   */
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
  /**
   * Extensions that cannot be ignored
   */
  modifierExtension: pipe(
    Schema.Array(Schema.suspend((): Schema.Schema<Extension, ExtensionEncoded> => Extension)),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<readonly Extension[]> => (fc: typeof FastCheck) =>
        fc.constant([]),
    }),
    Schema.optionalWith({
      default: (): readonly Extension[] => [],
    })
  ),
} as const satisfies Schema.Struct.Fields

type ResourceFields<TDomainType extends string> = typeof resourceFields & {
  domainType: Schema.optionalWith<Schema.Literal<[TDomainType]>, { default: () => TDomainType }>
  url: Schema.optionalWith<
    Schema.UndefinedOr<Schema.brand<Schema.Schema<ReadonlyUrl, string>, `${TDomainType}/url`>>,
    { default: () => undefined }
  >
}

type ResourceClass<Self, TDomainType extends string> = {
  readonly DomainType: TDomainType
  readonly UrlSchema: Schema.brand<Schema.Schema<ReadonlyUrl, string>, `${TDomainType}/url`>
} & Schema.Class<
  Self,
  ResourceFields<TDomainType>,
  Schema.Struct.Encoded<ResourceFields<TDomainType>>,
  Schema.Struct.Context<ResourceFields<TDomainType>>,
  Schema.Struct.Constructor<ResourceFields<TDomainType>>,
  object,
  object
>

/**
 * Factory that returns a Resource mixin class for a given domain type.
 *
 * The returned class includes all FHIR Resource fields: `meta`,
 * `text`, `contained`, `extension`, `modifierExtension`, plus `domainType`
 * (a defaulted literal) and an optional branded `url`.
 *
 * @typeParam TDomainType - The literal domain type string (e.g. `'Patient'`)
 * @param domainType - The domain type string literal
 * @returns A Schema.Class mixin to compose via `MergeClasses`
 */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- Self type parameter is the locally-defined class; cannot be named externally
export const Resource = <TDomainType extends string>(domainType: TDomainType) => {
  const urlSchema = pipe(ReadonlyUrl.FromString, Schema.brand(`${domainType}/url`))

  class ResourceMixin extends Schema.Class<ResourceMixin>('Resource')({
    ...resourceFields,
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
  }) {
    static readonly DomainType = domainType
    static readonly UrlSchema: Schema.brand<
      Schema.Schema<ReadonlyUrl, string>,
      `${TDomainType}/url`
    > = urlSchema
  }
  return ResourceMixin satisfies ResourceClass<ResourceMixin, TDomainType> as ResourceClass<
    ResourceMixin,
    TDomainType
  >
}
