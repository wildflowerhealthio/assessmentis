import { Schema } from 'effect'

export const BaseOriginDefinition = Schema.Struct({
  _tag: Schema.String,
  activeResources: Schema.Record({
    key: Schema.String,
    value: Schema.Literal(true),
  }),
}).annotations({ parseOptions: { onExcessProperty: 'preserve' } })

export type BaseOriginDefinition = typeof BaseOriginDefinition.Type
