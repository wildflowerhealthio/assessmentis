import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Period } from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

export const PeriodEncodedFromFhir: Schema.Schema<
  Period.PeriodEncoded,
  FhirR4.Period,
  BaseUrl
> = Schema.extend(
  ElementIdentification('Period'),
  mutableEncoded(
    Schema.Struct({
      start: Schema.optional(Schema.String),
      end: Schema.optional(Schema.String),
    })
  )
)

const PeriodSchema: Schema.Schema<Period.Period, FhirR4.Period, BaseUrl> =
  Schema.compose(PeriodEncodedFromFhir, Period.Period)

export const FhirR4Period = {
  Schema: PeriodSchema,
}
