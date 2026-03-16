import { Schema } from 'effect'

import { Period } from '@assessmentis/clinical-domain/data-types'
import type { PeriodEncoded } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/Element'
import type { BaseUrl } from '../UrlIdentification'

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
