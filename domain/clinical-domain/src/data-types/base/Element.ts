import { Schema } from 'effect'

import type { ExtensionEncoded } from '../special-purpose'
import { Extension } from '../special-purpose'

export interface Element<IdType extends string = string> {
  id?: IdType | undefined
  extension?: Extension[]
}

export interface ElementEncoded {
  id?: string | undefined
  extension?: ExtensionEncoded[]
}

export const Element = {
  Schema: <IdType extends string = string>(
    idSchema: Schema.Schema<IdType, string>
  ): Schema.Schema<Element<IdType>, ElementEncoded, never> =>
    Schema.mutable(
      Schema.Struct({
        id: Schema.optional(idSchema),
        extension: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Extension.Schema)))
        ),
      })
    ),
}
