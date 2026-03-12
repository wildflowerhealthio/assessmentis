import { pipe, Schema } from 'effect'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { Element, type ElementEncoded, type ElementFields } from './Element'

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
export interface BackboneElement<
  TDomainType extends string,
> extends Element<TDomainType> {
  readonly modifierExtension: ReadonlyArray<Extension>
}

const fields = {
  modifierExtension: pipe(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<Extension, ExtensionEncoded> => Extension
      )
    ),
    Schema.annotations({
      arbitrary: () => (fc) => fc.constant([]),
    }),
    Schema.optionalWith({
      default: (): ReadonlyArray<Extension> => [],
    })
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a BackboneElement. */
export type BackboneElementEncoded<TDomainType extends string> =
  ElementEncoded<TDomainType> & {
    readonly modifierExtension?: ReadonlyArray<ExtensionEncoded> | undefined
  }

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

type BackboneElementFields<TDomainType extends string> =
  ElementFields<TDomainType> & typeof fields

type BackboneElementClass<Self, TDomainType extends string> = {
  readonly DomainType: TDomainType
  readonly UrlSchema: Schema.brand<
    Schema.Schema<ReadonlyUrl, string, never>,
    `${TDomainType}/url`
  >
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
 * @returns A Schema.Class mixin to compose via `MergeClasses` or `.extend`
 */
export const BackboneElement = <TDomainType extends string>(
  domainType: TDomainType
) => {
  const ElementBase = Element(domainType)
  class BackboneElementMixin extends ElementBase.extend<BackboneElementMixin>(
    'BackboneElement'
  )(fields) {
    static DomainType = ElementBase.DomainType
    static UrlSchema = ElementBase.UrlSchema
  }
  return BackboneElementMixin satisfies BackboneElementClass<
    BackboneElementMixin,
    TDomainType
  > as BackboneElementClass<BackboneElementMixin, TDomainType>
}
