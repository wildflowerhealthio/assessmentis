import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Quantity,
  type QuantityEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '../../TwoStepExternalSchema'

const EncodedFromFhir: Schema.Schema<
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

export const FhirR4Quantity = new TwoStepExternalSchema(Quantity, EncodedFromFhir)
