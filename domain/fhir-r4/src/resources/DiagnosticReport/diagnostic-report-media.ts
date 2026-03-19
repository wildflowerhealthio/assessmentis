import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'

export const DiagnosticReportMediaEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('DiagnosticReportMedia'),
  mutableEncoded(
    Schema.Struct({
      comment: Schema.optional(Schema.String),
      link: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
    })
  )
)
