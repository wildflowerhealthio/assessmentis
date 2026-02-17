import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { ContactPoint } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Period } from './Period'

const FhirR4ContactPointSchema: Schema.Schema<
  ContactPoint,
  FhirR4.ContactPoint,
  never
> = Schema.mutable(
  Schema.Struct({
    system: Schema.optional(
      Schema.Union(
        Schema.Literal('phone'),
        Schema.Literal('fax'),
        Schema.Literal('email'),
        Schema.Literal('pager'),
        Schema.Literal('url'),
        Schema.Literal('sms'),
        Schema.Literal('other')
      )
    ),
    value: Schema.optional(Schema.String),
    use: Schema.optional(
      Schema.Union(
        Schema.Literal('home'),
        Schema.Literal('work'),
        Schema.Literal('temp'),
        Schema.Literal('old'),
        Schema.Literal('mobile')
      )
    ),
    rank: Schema.optional(Schema.Number),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
  })
)

export const FhirR4ContactPoint = {
  Schema: FhirR4ContactPointSchema,
}
