import { Schema } from 'effect'

import { Period } from '@assessmentis/clinical-domain/data-types'
import type { PeriodEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'

const EncodedFromFhir: Schema.Schema<PeriodEncoded, FhirR4.Period, BaseUrl> = Schema.extend(
  ElementEncodedFromFhir('Period'),
  mutableEncoded(
    Schema.Struct({
      end: Schema.optional(Schema.String),
      start: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4Period = new TwoStepExternalSchema(Period, EncodedFromFhir)
