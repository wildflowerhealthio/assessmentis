import { Schema } from 'effect'
import { PatientLinkType } from '@assessmentis/clinical-domain'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { mutableEncoded } from '@assessmentis/util'

export const PatientLinkEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientLink'),
  mutableEncoded(
    Schema.Struct({
      other: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
      type: PatientLinkType,
    })
  )
)
