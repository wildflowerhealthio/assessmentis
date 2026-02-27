import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { mutableEncoded } from '@assessmentis/util'

export const DiagnosticReportMediaEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('DiagnosticReportMedia'),
  mutableEncoded(
    Schema.Struct({
      comment: Schema.optional(Schema.String),
      link: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
    })
  )
)
