import { Schema } from 'effect'
import { Element } from '../base/Element'
import { Extension } from '../special-purpose/Extension'

export interface BackboneElement<
  TypeId extends string,
> extends Element<TypeId> {
  modifierExtension?: Extension[]
}

export const BackboneElement = {
  Schema: <IdType extends string>(
    idSchema: Schema.Schema<IdType, string>
  ) =>
    Schema.extend(
      Element.Schema(idSchema),
      Schema.mutable(
        Schema.Struct({
          modifierExtension: Schema.optional(
            Schema.mutable(
              Schema.Array(Schema.suspend(() => Extension.Schema))
            )
          ),
        })
      )
    ),
}
