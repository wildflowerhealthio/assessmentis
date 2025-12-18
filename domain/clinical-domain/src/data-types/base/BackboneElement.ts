import { Schema } from 'effect'
import { Element } from '../base/Element'
import { Extension } from '../special-purpose/Extension'

export const BackboneElement = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
) =>
  Schema.Struct({
    ...Element(idSchema).fields,
    modifierExtension: Schema.optional(Schema.Array(Extension)),
  })

export type BackboneElement<TypeId extends string> = ReturnType<
  typeof BackboneElement<TypeId>
>['Type']
