import { pipe, Schema } from 'effect'
import { Element, type ElementEncoded } from './Element'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { applySchemaMixinTo } from '@assessmentis/util'

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
  const ElementMixin = Element(domainType)

  const backboneFields = {
    ...ElementMixin.fields,
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

  class BackboneElementMixin extends Schema.Class<BackboneElementMixin>(
    'BackboneElement'
  )(backboneFields) {}
  return applySchemaMixinTo(BackboneElementMixin, ElementMixin)
}
