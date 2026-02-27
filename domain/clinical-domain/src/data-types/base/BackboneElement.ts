import { pipe, Schema } from 'effect'
import { Element, type ElementEncoded } from './Element'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { MergeClasses } from '@assessmentis/util'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackboneElement<
  TDomainType extends string,
> extends Element<TDomainType> {
  readonly modifierExtension: ReadonlyArray<Extension>
}

export type BackboneElementEncoded<TDomainType extends string> =
  ElementEncoded<TDomainType> & {
    readonly modifierExtension?: ReadonlyArray<ExtensionEncoded> | undefined
  }

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const BackboneElement = <TDomainType extends string>(
  domainType: TDomainType
) => {
  const ElementBase = Element(domainType)
  class BackboneElementMixin extends ElementBase.extend<BackboneElementMixin>(
    'BackboneElement'
  )({
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
  }) {
    static Key = ElementBase.Key
    static UrlSchema = ElementBase.UrlSchema
  }
  return BackboneElementMixin
}
