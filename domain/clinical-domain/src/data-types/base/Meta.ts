import { Schema } from 'effect'
import { Coding, type CodingEncoded } from '../complex/Coding'

const Key = 'Meta' as const
type Key = typeof Key

const fields = {
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.DateTimeUtc),
  source: Schema.optional(Schema.URL),
  // profile: canonical(StructureDefinition),
  security: Schema.optional(
    Schema.Array(
      Schema.suspend((): Schema.Schema<Coding, CodingEncoded, never> => Coding)
    )
  ),
  tag: Schema.optional(
    Schema.Array(
      Schema.suspend((): Schema.Schema<Coding, CodingEncoded, never> => Coding)
    )
  ),
} as const satisfies Schema.Struct.Fields

export interface MetaEncoded extends Schema.Struct.Encoded<typeof fields> {}

export class Meta extends Schema.Class<Meta>(Key)(fields) {
  static readonly Key = Key
}
