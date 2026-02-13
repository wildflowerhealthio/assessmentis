import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type {
  Meta as FhirMeta,
  DomainResource as FhirDomainResource,
} from 'fhir/r4'
import { Coding } from '../complex/Coding'
import { Narrative } from '../special-purpose/Narrative'
import { ResourceFromFhirR4, type Resource } from './Resource'
import {
  ExtensionFromFhirR4,
  type Extension,
} from '../special-purpose/Extension'
import type { DeepReadonly } from '@assessmentis/util'

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
  contained?: ReadonlyArray<unknown> // Resource
  /**
   * Additional content defined by implementations
   */
  extension?: ReadonlyArray<Extension>
  /**
   * Extensions that cannot be ignored
   */
  modifierExtension?: ReadonlyArray<Extension>
}

export const DomainResourceFromFhirR4 = <IdType extends string>(
  idSchema: Schema.Schema<IdType, string>
): Schema.Schema<
  DomainResource<IdType>,
  DeepReadonly<FhirDomainResource>,
  never
> =>
  Schema.extend(
    ResourceFromFhirR4(idSchema),
    Schema.Struct({
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
      extension: Schema.optional(
        Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
      ),
      /**
       * Extensions that cannot be ignored
       */
      modifierExtension: Schema.optional(
        Schema.Array(Schema.suspend(() => ExtensionFromFhirR4))
      ),
    })
  )

export interface Meta {
  readonly versionId?: string
  readonly lastUpdated?: DateTime.Utc
  readonly source?: URL
  // readonly profile: canonical(StructureDefinition),
  readonly security?: ReadonlyArray<Coding>
  readonly tag?: ReadonlyArray<Coding>
}

export const Meta: Schema.Schema<
  Meta,
  DeepReadonly<FhirMeta>,
  never
> = Schema.Struct({
  versionId: Schema.optional(Schema.String),
  lastUpdated: Schema.optional(Schema.DateTimeUtc),
  source: Schema.optional(Schema.URL),
  // profile: canonical(StructureDefinition),
  security: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
  tag: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
})
