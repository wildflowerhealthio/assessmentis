import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Quantity } from '@assessmentis/clinical-domain/data-types'
import { QuantityId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'

const FhirR4QuantitySchema: Schema.Schema<Quantity, FhirR4.Quantity, never> =
  Schema.extend(
    FhirR4Element.Schema(QuantityId),
    Schema.mutable(
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

export const FhirR4Quantity = {
  Schema: FhirR4QuantitySchema,
}
