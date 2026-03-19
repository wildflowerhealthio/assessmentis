import { Schema } from 'effect'

import { Quantity } from '@assessmentis/clinical-domain/data-types'
import type { QuantityEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'

const EncodedFromFhir: Schema.Schema<QuantityEncoded, FhirR4.Quantity, BaseUrl> = Schema.extend(
  ElementEncodedFromFhir('Quantity'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.optional(Schema.String),
      comparator: Schema.optional(
        Schema.Union(
          Schema.Literal('<'),
          Schema.Literal('<='),
          Schema.Literal('>='),
          Schema.Literal('>')
        )
      ),
      system: Schema.optional(Schema.String),
      unit: Schema.optional(Schema.String),
      value: Schema.optional(Schema.Finite),
    })
  )
)

export const FhirR4Quantity = new TwoStepExternalSchema(Quantity, EncodedFromFhir)
