import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Period,
  type PeriodEncoded,
} from '@assessmentis/clinical-domain/data-types'
import type { BaseUrl } from '../UrlIdentification'
import { ElementEncodedFromFhir } from '../base/Element'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<PeriodEncoded, FhirR4.Period, BaseUrl> =
  Schema.extend(
    ElementEncodedFromFhir('Period'),
    mutableEncoded(
      Schema.Struct({
        start: Schema.optional(Schema.String),
        end: Schema.optional(Schema.String),
      })
    )
  )

export const FhirR4Period = new TwoStepExternalSchema(Period, EncodedFromFhir)
