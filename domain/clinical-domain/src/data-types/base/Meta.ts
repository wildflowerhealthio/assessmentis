import { Schema } from 'effect'

import { Coding, type CodingEncoded } from '../complex/Coding'

const DomainType = 'Meta' as const
type DomainType = typeof DomainType

const fields = {
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.DateTimeUtc),
  source: Schema.optional(Schema.String),
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

/** Encoded (wire-format) shape of a {@link Meta}. */
export interface MetaEncoded extends Schema.Struct.Encoded<typeof fields> {}

/**
 * FHIR R4 Meta data type — resource-level metadata including version, last
 * updated timestamp, source, security labels, and tags.
 */
export class Meta extends Schema.Class<Meta>(DomainType)(fields) {
  static readonly DomainType = DomainType
}
