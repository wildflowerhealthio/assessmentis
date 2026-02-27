import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { HumanName } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { PeriodEncodedFromFhir } from './Period'

export const HumanNameEncodedFromFhir: Schema.Schema<
  HumanName.HumanNameEncoded,
  FhirR4.HumanName,
  BaseUrl
> = mutableEncoded(
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
    given: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    prefix: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    suffix: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
  })
)

const HumanNameSchema: Schema.Schema<
  HumanName.HumanName,
  FhirR4.HumanName,
  BaseUrl
> = Schema.compose(HumanNameEncodedFromFhir, HumanName.HumanName)

export const FhirR4HumanName = {
  Schema: HumanNameSchema,
}
