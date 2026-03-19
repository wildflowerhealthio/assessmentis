import { Schema } from 'effect'

import { Address } from '@assessmentis/clinical-domain/data-types'
import type { AddressEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import type { BaseUrl } from '../url-identification'
import { FhirR4Period } from './period'

const EncodedFromFhir: Schema.Schema<AddressEncoded, FhirR4.Address, BaseUrl> = mutableEncoded(
  Schema.Struct({
    city: Schema.optional(Schema.String),
    country: Schema.optional(Schema.String),
    district: Schema.optional(Schema.String),
    line: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
    postalCode: Schema.optional(Schema.String),
    state: Schema.optional(Schema.String),
    text: Schema.optional(Schema.String),
    type: Schema.optional(
      Schema.Union(Schema.Literal('postal'), Schema.Literal('physical'), Schema.Literal('both'))
    ),
    use: Schema.optional(
      Schema.Union(
        Schema.Literal('home'),
        Schema.Literal('work'),
        Schema.Literal('temp'),
        Schema.Literal('old'),
        Schema.Literal('billing')
      )
    ),
  })
)

export const FhirR4Address = new TwoStepExternalSchema(Address, EncodedFromFhir)
