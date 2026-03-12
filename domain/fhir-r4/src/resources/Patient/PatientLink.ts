import { Schema } from 'effect'

import { PatientLinkType } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'

export const PatientLinkEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientLink'),
  mutableEncoded(
    Schema.Struct({
      other: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
      type: PatientLinkType,
    })
  )
)
