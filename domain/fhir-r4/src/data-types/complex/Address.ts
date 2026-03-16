import { Schema } from 'effect'

import { Address } from '@assessmentis/clinical-domain/data-types'
import type { AddressEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import type { BaseUrl } from '../UrlIdentification'
import { FhirR4Period } from './Period'

const EncodedFromFhir: Schema.Schema<AddressEncoded, FhirR4.Address, BaseUrl> =
  mutableEncoded(
    Schema.Struct({
      use: Schema.optional(
        Schema.Union(
          Schema.Literal('home'),
          Schema.Literal('work'),
          Schema.Literal('temp'),
          Schema.Literal('old'),
          Schema.Literal('billing')
        )
      ),
      type: Schema.optional(
        Schema.Union(
          Schema.Literal('postal'),
          Schema.Literal('physical'),
          Schema.Literal('both')
        )
      ),
      text: Schema.optional(Schema.String),
      line: Schema.optional(mutableEncoded(Schema.Array(Schema.String))),
      city: Schema.optional(Schema.String),
      district: Schema.optional(Schema.String),
      state: Schema.optional(Schema.String),
      postalCode: Schema.optional(Schema.String),
      country: Schema.optional(Schema.String),
      period: Schema.optional(
        Schema.suspend(() => FhirR4Period.EncodedFromExternal)
      ),
    })
  )

export const FhirR4Address = new TwoStepExternalSchema(Address, EncodedFromFhir)
