import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Range } from '@assessmentis/clinical-domain/data-types'
import { RangeId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'
import { FhirR4Quantity } from './Quantity'

const FhirR4RangeSchema: Schema.Schema<Range, FhirR4.Range, never> =
  Schema.extend(
    FhirR4Element.Schema(RangeId),
    Schema.mutable(
      Schema.Struct({
        low: Schema.optional(FhirR4Quantity.Schema),
        high: Schema.optional(FhirR4Quantity.Schema),
      })
    )
  )

export const FhirR4Range = {
  Schema: FhirR4RangeSchema,
}
