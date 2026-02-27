import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Coding } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

export const CodingEncodedFromFhir: Schema.Schema<
  Coding.CodingEncoded,
  FhirR4.Coding,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Coding'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.optional(Schema.String),
      display: Schema.optional(Schema.String),
      system: Schema.optional(Schema.String),
      userSelected: Schema.optional(Schema.Boolean),
      version: Schema.optional(Schema.String),
    })
  )
)
const CodingSchema: Schema.Schema<Coding.Coding, FhirR4.Coding, BaseUrl> =
  Schema.compose(CodingEncodedFromFhir, Coding.Coding)

export const FhirR4Coding = {
  Schema: CodingSchema,
}
