import { Schema } from 'effect'

import {
  Quantity,
  type QuantityEncoded,
} from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'

const EncodedFromFhir: Schema.Schema<
  QuantityEncoded,
  FhirR4.Quantity,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('Quantity'),
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

export const FhirR4Quantity = new TwoStepExternalSchema(
  Quantity,
  EncodedFromFhir
)
