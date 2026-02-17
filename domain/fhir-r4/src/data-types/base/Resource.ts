import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Resource } from '@assessmentis/clinical-domain/data-types'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Meta } from './DomainResource'

export const FhirR4Resource = {
  Schema: <IdType extends string>(
    idSchema: Schema.Schema<IdType, string>
  ): Schema.Schema<Resource<IdType>, FhirR4.Resource, never> =>
    Schema.mutable(
      Schema.Struct({
        id: Schema.optional(idSchema),
        resourceType: Schema.String,
        meta: Schema.optional(FhirR4Meta.Schema),
        implicitRules: Schema.optional(Schema.URL),
        language: Schema.optional(Code),
      })
    ),
}
