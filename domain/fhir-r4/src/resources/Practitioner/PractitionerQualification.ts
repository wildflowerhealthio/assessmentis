import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'

export const PractitionerQualificationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PractitionerQualification'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal))
        )
      ),
      code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      issuer: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
    })
  )
)
