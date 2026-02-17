import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { Coding } from '../complex/Coding'
import { Narrative } from '../special-purpose/Narrative'
import { Resource } from './Resource'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'

export interface DomainResource<
  IdType extends string,
> extends Resource<IdType> {
  /**
   * Text summary of the resource, for human interpretation
   */
  text?: Narrative
  /**
   * Contained, inline Resources
   */
  contained?: unknown[] // Resource
  /**
   * Additional content defined by implementations
   */
  extension?: Extension[]
  /**
   * Extensions that cannot be ignored
   */
  modifierExtension?: Extension[]
}

export const DomainResource = {
  Schema: <IdType extends string>(idSchema: Schema.Schema<IdType, string>) =>
    Schema.extend(
      Resource.Schema(idSchema),
      Schema.mutable(
        Schema.Struct({
          /**
           * Text summary of the resource, for human interpretation
           */
          text: Schema.optional(Narrative.Schema),
          /**
           * Contained, inline Resources
           */
          contained: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))), // Resource
          /**
           * Additional content defined by implementations
           */
          extension: Schema.optional(
            Schema.mutable(Schema.Array(Schema.suspend(() => Extension.Schema)))
          ),
          /**
           * Extensions that cannot be ignored
           */
          modifierExtension: Schema.optional(
            Schema.mutable(Schema.Array(Schema.suspend(() => Extension.Schema)))
          ),
        })
      )
    ),
}

export interface Meta {
  readonly versionId?: string
  readonly lastUpdated?: DateTime.Utc
  readonly source?: URL
  // readonly profile: canonical(StructureDefinition),
  readonly security?: Coding[]
  readonly tag?: Coding[]
}

export const Meta = {
  Schema: Schema.mutable(
    Schema.Struct({
      versionId: Schema.optional(Schema.String),
      lastUpdated: Schema.optional(Schema.DateTimeUtc),
      source: Schema.optional(Schema.URL),
      // profile: canonical(StructureDefinition),
      security: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Coding.Schema)))
      ),
      tag: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Coding.Schema)))
      ),
    })
  ),
}
