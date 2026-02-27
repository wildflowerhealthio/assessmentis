import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Address } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { PeriodEncodedFromFhir } from './Period'

export const AddressEncodedFromFhir: Schema.Schema<
  Address.AddressEncoded,
  FhirR4.Address,
  BaseUrl
> = mutableEncoded(
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
    line: mutableEncoded(Schema.Array(Schema.String)).pipe(
      Schema.optionalWith({ default: () => [] })
    ),
    city: Schema.optional(Schema.String),
    district: Schema.optional(Schema.String),
    state: Schema.optional(Schema.String),
    postalCode: Schema.optional(Schema.String),
    country: Schema.optional(Schema.String),
    period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
  })
)

const AddressSchema: Schema.Schema<Address.Address, FhirR4.Address, BaseUrl> =
  Schema.compose(AddressEncodedFromFhir, Address.Address)

export const FhirR4Address = {
  Schema: AddressSchema,
}
