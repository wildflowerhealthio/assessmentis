import { Schema } from 'effect'
import { Coding } from '../../general-purpose/Coding'
import { Narrative } from '../../general-purpose/Narrative'
import { Resource } from './Resource'
import { Extension } from '../../general-purpose/BackboneElement'

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
    contained: Schema.optional(Schema.Array(Schema.Any)), // Resource
    /**
     * Additional content defined by implementations
     */
    extension: Schema.optional(Schema.Array(Extension)),
    /**
     * Extensions that cannot be ignored
     */
    modifierExtension: Schema.optional(Schema.Array(Extension)),
  })

export const Meta = Schema.Struct({
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.String),
  source: Schema.optional(Schema.URL),
  // profile: canonical(StructureDefinition),
  security: Schema.optional(Schema.Array(Coding)),
  tag: Schema.optional(Schema.Array(Coding)),
})
