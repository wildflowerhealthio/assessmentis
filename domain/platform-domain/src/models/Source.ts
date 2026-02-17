import { Schema } from 'effect'

export interface Source {
  sourceType: string
  url: string
  activeResources: { [key: string]: boolean }
}

export const SourceSchema: Schema.Schema<Source> = Schema.Struct({
  sourceType: Schema.String,
  url: Schema.String,
  activeResources: Schema.Record({
    key: Schema.String,
    value: Schema.Boolean,
  }),
})
