import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Address } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Period } from './Period'

const FhirR4AddressSchema: Schema.Schema<Address, FhirR4.Address, never> =
  Schema.mutable(
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
      line: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
      city: Schema.optional(Schema.String),
      district: Schema.optional(Schema.String),
      state: Schema.optional(Schema.String),
      postalCode: Schema.optional(Schema.String),
      country: Schema.optional(Schema.String),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
    })
  )

export const FhirR4Address = {
  Schema: FhirR4AddressSchema,
}
