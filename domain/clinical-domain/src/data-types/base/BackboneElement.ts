import { Schema } from 'effect'
import { Element, ElementEncoded } from '../base/Element'
import { Extension, ExtensionEncoded } from '../special-purpose/Extension'

export interface BackboneElement<
  TypeId extends string,
> extends Element<TypeId> {
  modifierExtension?: ReadonlyArray<Extension>
}

export interface BackboneElementEncoded<
  TypeId extends string,
> extends ElementEncoded<TypeId> {
  modifierExtension?: ReadonlyArray<ExtensionEncoded>
}
export const BackboneElement = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
) =>
  Schema.Struct({
    ...Element(idSchema).fields,
    modifierExtension: Schema.optional(
      Schema.Array(Schema.suspend(() => Extension))
    ),
  })
