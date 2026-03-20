import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { Extension } from '../special-purpose/extension'
import type { ExtensionEncoded } from '../special-purpose/extension'
import { Element } from './element'
import type { ElementEncoded, ElementFields } from './element'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Decoded shape of a BackboneElement — extends {@link Element} with
 * `modifierExtension`. Used for nested structures within resources
 * (e.g. `Patient.contact`, `Encounter.participant`).
 *
 * @typeParam TDomainType - The literal domain type string
 */
export interface BackboneElement<TDomainType extends string> extends Element<TDomainType> {
  readonly modifierExtension: readonly Extension[]
}

const fields = {
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

/** Encoded (wire-format) shape of a BackboneElement. */
export type BackboneElementEncoded<TDomainType extends string> = ElementEncoded<TDomainType> & {
  readonly modifierExtension?: readonly ExtensionEncoded[] | undefined
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

type BackboneElementFields<TDomainType extends string> = ElementFields<TDomainType> & typeof fields

type BackboneElementClass<Self, TDomainType extends string> = {
  readonly DomainType: TDomainType
  readonly UrlSchema: Schema.brand<Schema.Schema<ReadonlyUrl, string>, `${TDomainType}/url`>
} & Schema.Class<
  Self,
  BackboneElementFields<TDomainType>,
  Schema.Struct.Encoded<BackboneElementFields<TDomainType>>,
  Schema.Struct.Context<BackboneElementFields<TDomainType>>,
  Schema.Struct.Constructor<BackboneElementFields<TDomainType>>,
  object,
  object
>

/**
 * Factory that returns a BackboneElement mixin class for a given domain type.
 *
 * Extends {@link Element} with a `modifierExtension` array. Used for nested
 * structures within FHIR resources.
 *
 * @typeParam TDomainType - The literal domain type string
 * @param domainType - The domain type string literal
 * @returns A Schema.Class mixin to compose via `.extend`
 */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- Self type parameter is the locally-defined class; cannot be named externally
export const BackboneElement = <TDomainType extends string>(domainType: TDomainType) => {
  const ElementBase = Element(domainType)
  class BackboneElementMixin extends ElementBase.extend<BackboneElementMixin>('BackboneElement')(
    fields
  ) {
    static readonly DomainType = ElementBase.DomainType
    static readonly UrlSchema = ElementBase.UrlSchema
  }
  return BackboneElementMixin satisfies BackboneElementClass<
    BackboneElementMixin,
    TDomainType
  > as BackboneElementClass<BackboneElementMixin, TDomainType>
}
