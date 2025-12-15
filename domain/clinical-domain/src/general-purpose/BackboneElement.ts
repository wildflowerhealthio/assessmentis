import { Schema } from 'effect'
import { Element } from './Element'
import { ValueElement, ValueElementEncoded } from './ValueElement'

export type Extension = {
  url: string
} & ValueElement

export type ExtensionEncoded = {
  url: string
} & ValueElementEncoded

export const Extension: Schema.Schema<Extension, ExtensionEncoded> =
  Schema.extend(
    Schema.Struct({
      url: Schema.String,
    }),
    ValueElement
  )

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
