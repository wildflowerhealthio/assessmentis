import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { Period } from '@assessmentis/clinical-domain/data-types'
import { PeriodId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'

const FhirR4PeriodSchema: Schema.Schema<Period, FhirR4.Period, never> =
  Schema.extend(
    FhirR4Element.Schema(PeriodId),
    Schema.mutable(
      Schema.Struct({
        start: Schema.optional(Schema.DateTimeUtc),
        end: Schema.optional(Schema.DateTimeUtc),
      })
    )
  )

export const FhirR4Period = {
  Schema: FhirR4PeriodSchema,
}
