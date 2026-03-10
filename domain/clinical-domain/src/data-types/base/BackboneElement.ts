import { pipe, Schema } from 'effect'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { Element, type ElementEncoded, type ElementFields } from './Element'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
      default: [],
    }),
    Schema.optionalWith({
      default: (): ReadonlyArray<Extension> => [],
    })
  ),
} as const satisfies Schema.Struct.Fields

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
