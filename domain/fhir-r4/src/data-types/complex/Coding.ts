import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Coding } from '@assessmentis/clinical-domain/data-types'
import { Code, CodingId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'

const FhirR4CodingSchema: Schema.Schema<Coding, FhirR4.Coding, never> =
  Schema.extend(
    FhirR4Element.Schema(CodingId),
    Schema.mutable(
      Schema.Struct({
        code: Schema.optional(Code),
        display: Schema.optional(Schema.String),
        system: Schema.optional(Schema.String),
        userSelected: Schema.optional(Schema.Boolean),
        version: Schema.optional(Schema.String),
      })
    )
  )

export const FhirR4Coding = {
  Schema: FhirR4CodingSchema,
}
