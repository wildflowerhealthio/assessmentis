import { Schema } from 'effect'
import { Element } from './Element'
import { ValueElement } from './ValueElement'

export const Extension = Schema.extend(
  Schema.Struct({
    url: Schema.String,
  }),
  ValueElement
)

export type Extension = typeof Extension.Type

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
