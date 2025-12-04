import { Schema } from 'effect'
import { Coding } from './Coding'
import { Narrative } from './Narrative'
import { Resource } from './Resource'
export const DomainResource = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
) =>
  Schema.Struct({
    ...Resource(idSchema).fields,
    /**
     * Text summary of the resource, for human interpretation
     */
    text: Schema.optional(Narrative),
    /**
     * Contained, inline Resources
     */
    contained: Schema.optional(Schema.Array(Schema.Unknown)), // Resource
    // extension
    // modifierExtension
  })

export const Meta = Schema.Struct({
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.String),
  source: Schema.optional(Schema.URL),
  // profile: canonical(StructureDefinition),
  security: Schema.optional(Schema.Array(Coding)),
  tag: Schema.optional(Schema.Array(Coding)),
})
