import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { HumanName } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Period } from './Period'

const FhirR4HumanNameSchema: Schema.Schema<
  HumanName,
  FhirR4.HumanName,
  never
> = Schema.mutable(
  Schema.Struct({
    use: Schema.optional(
      Schema.Union(
        Schema.Literal('usual'),
        Schema.Literal('official'),
        Schema.Literal('temp'),
        Schema.Literal('nickname'),
        Schema.Literal('anonymous'),
        Schema.Literal('old'),
        Schema.Literal('maiden')
      )
    ),
    text: Schema.optional(Schema.String),
    family: Schema.optional(Schema.String),
    given: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    prefix: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    suffix: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
  })
)

export const FhirR4HumanName = {
  Schema: FhirR4HumanNameSchema,
}
