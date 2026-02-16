import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import { CodingFromFhirR4, type Coding } from '../complex/Coding'
import { Narrative } from '../special-purpose/Narrative'
import { ResourceFromFhirR4, type Resource } from './Resource'
import {
  ExtensionFromFhirR4,
  type Extension,
} from '../special-purpose/Extension'

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

export const DomainResourceFromFhirR4 = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<DomainResource<IdType>, fhir.DomainResource, never> =>
  Schema.extend(
    ResourceFromFhirR4(idSchema),
    Schema.mutable(
      Schema.Struct({
        /**
         * Text summary of the resource, for human interpretation
         */
        text: Schema.optional(Narrative),
        /**
         * Contained, inline Resources
         */
        contained: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))), // Resource
        /**
         * Additional content defined by implementations
         */
        extension: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
          )
        ),
        /**
         * Extensions that cannot be ignored
         */
        modifierExtension: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
          )
        ),
      })
    )
  )

export interface Meta {
  readonly versionId?: string
  readonly lastUpdated?: DateTime.Utc
  readonly source?: URL
  // readonly profile: canonical(StructureDefinition),
  readonly security?: Coding[]
  readonly tag?: Coding[]
}

export const Meta: Schema.Schema<Meta, fhir.Meta, never> = Schema.mutable(
  Schema.Struct({
    versionId: Schema.optional(Schema.String),
    lastUpdated: Schema.optional(Schema.DateTimeUtc),
    source: Schema.optional(Schema.URL),
    // profile: canonical(StructureDefinition),
    security: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodingFromFhirR4)))
    ),
    tag: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodingFromFhirR4)))
    ),
  })
)
