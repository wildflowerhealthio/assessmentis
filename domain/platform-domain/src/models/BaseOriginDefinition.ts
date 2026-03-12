import { SafeRecordKey } from '@assessmentis/util'
import { Schema } from 'effect'

export const BaseOriginDefinition = Schema.Struct({
  _tag: Schema.String,
  supportedResources: Schema.Record({
    key: SafeRecordKey,
    value: Schema.Literal(true),
  }),
}).annotations({ parseOptions: { onExcessProperty: 'preserve' } })

export type BaseOriginDefinition = typeof BaseOriginDefinition.Type
