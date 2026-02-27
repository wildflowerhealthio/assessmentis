import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { HumanName } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '../../TwoStepExternalSchema'
import { FhirR4Period } from './Period'

const EncodedFromFhir: Schema.Schema<
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
    period: Schema.optional(
      Schema.suspend(() => FhirR4Period.EncodedFromExternal)
    ),
  })
)

export const FhirR4HumanName = new TwoStepExternalSchema(
  HumanName.HumanName,
  EncodedFromFhir
)
