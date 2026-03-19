import { Schema } from 'effect'

import type { PatientContactEncoded } from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4Address } from '../../data-types/complex/address'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4ContactPoint } from '../../data-types/complex/contact-point'
import { FhirR4HumanName } from '../../data-types/complex/human-name'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'
import type { BaseUrl } from '../../data-types/url-identification'

export const PatientContactEncodedFromFhir: Schema.Schema<
  PatientContactEncoded,
  FhirR4.PatientContact,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('PatientContact'),
  mutableEncoded(
    Schema.Struct({
      address: Schema.optional(Schema.suspend(() => FhirR4Address.EncodedFromExternal)),
      gender: Schema.optional(AdministrativeGender),
      name: Schema.optional(Schema.suspend(() => FhirR4HumanName.EncodedFromExternal)),
      organization: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      relationship: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)))
      ),
    })
  )
)
