import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4Coding } from '../complex/Coding'
import { FhirR4Narrative } from '../special-purpose/Narrative'
import { FhirR4Resource } from './Resource'
import { FhirR4Extension } from '../special-purpose/Extension'
import type {
  DomainResource,
  Meta,
} from '@assessmentis/clinical-domain/data-types'

export const FhirR4DomainResource = {
  Schema: <IdType extends string>(
    idSchema: Schema.Schema<IdType, string>
  ): Schema.Schema<DomainResource<IdType>, FhirR4.DomainResource, never> =>
    Schema.extend(
      FhirR4Resource.Schema(idSchema),
      Schema.mutable(
        Schema.Struct({
          text: Schema.optional(FhirR4Narrative.Schema),
          contained: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))),
          extension: Schema.optional(
            Schema.mutable(
              Schema.Array(Schema.suspend(() => FhirR4Extension.Schema))
            )
          ),
          modifierExtension: Schema.optional(
            Schema.mutable(
              Schema.Array(Schema.suspend(() => FhirR4Extension.Schema))
            )
          ),
        })
      )
    ),
}

const FhirR4MetaSchema: Schema.Schema<Meta, FhirR4.Meta, never> =
  Schema.mutable(
    Schema.Struct({
      versionId: Schema.optional(Schema.String),
      lastUpdated: Schema.optional(Schema.DateTimeUtc),
      source: Schema.optional(Schema.URL),
      security: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Coding.Schema)))
      ),
      tag: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Coding.Schema)))
      ),
    })
  )

export const FhirR4Meta = {
  Schema: FhirR4MetaSchema,
}
