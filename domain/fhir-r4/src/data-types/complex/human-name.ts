import { Schema } from 'effect'

import { HumanName } from '@assessmentis/clinical-domain/data-types'
import type { HumanNameEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import type { BaseUrl } from '../url-identification'
import { FhirR4Period } from './period'

const EncodedFromFhir: Schema.Schema<HumanNameEncoded, FhirR4.HumanName, BaseUrl> = mutableEncoded(
  Schema.Struct({
    family: Schema.optional(Schema.String),
    given: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
    prefix: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    suffix: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    text: Schema.optional(Schema.String),
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
  })
)

export const FhirR4HumanName = new TwoStepExternalSchema(HumanName, EncodedFromFhir)
