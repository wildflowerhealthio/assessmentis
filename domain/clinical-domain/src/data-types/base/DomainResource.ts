import { Schema } from 'effect'
import { Coding } from '../complex/Coding'
import { Narrative } from '../special-purpose/Narrative'
import { Resource } from './Resource'
import { Extension } from '../special-purpose/Extension'

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
    extension: Schema.optional(Schema.Array(Schema.suspend(() => Extension))),
    /**
     * Extensions that cannot be ignored
     */
    modifierExtension: Schema.optional(
      Schema.Array(Schema.suspend(() => Extension))
    ),
  })

export const Meta = Schema.Struct({
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.DateTimeUtc),
  source: Schema.optional(Schema.URL),
  // profile: canonical(StructureDefinition),
  security: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
  tag: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
})
