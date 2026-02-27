import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { ContactPoint } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { PeriodEncodedFromFhir } from './Period'

export const ContactPointEncodedFromFhir: Schema.Schema<
  ContactPoint.ContactPointEncoded,
  FhirR4.ContactPoint,
  BaseUrl
> = mutableEncoded(
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
    period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
  })
)

const ContactPointSchema: Schema.Schema<
  ContactPoint.ContactPoint,
  FhirR4.ContactPoint,
  BaseUrl
> = Schema.compose(ContactPointEncodedFromFhir, ContactPoint.ContactPoint)

export const FhirR4ContactPoint = {
  Schema: ContactPointSchema,
}
