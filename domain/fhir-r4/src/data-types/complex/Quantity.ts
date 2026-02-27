import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Quantity,
  type QuantityEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

export const QuantityEncodedFromFhir: Schema.Schema<
  QuantityEncoded,
  FhirR4.Quantity,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Quantity'),
  mutableEncoded(
    Schema.Struct({
      value: Schema.optional(Schema.Number),
      unit: Schema.optional(Schema.String),
      system: Schema.optional(Schema.String),
      code: Schema.optional(Schema.String),
      comparator: Schema.optional(
        Schema.Union(
          Schema.Literal('<'),
          Schema.Literal('<='),
          Schema.Literal('>='),
          Schema.Literal('>')
        )
      ),
    })
  )
)

const QuantitySchema: Schema.Schema<Quantity, FhirR4.Quantity, BaseUrl> =
  Schema.compose(QuantityEncodedFromFhir, Quantity)

export const FhirR4Quantity = {
  Schema: QuantitySchema,
}
