import { Schema } from 'effect'

import type { PatientContactEncoded } from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import { FhirR4HumanName } from '../../data-types/complex/HumanName'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'

export const PatientContactEncodedFromFhir: Schema.Schema<
  PatientContactEncoded,
  FhirR4.PatientContact,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('PatientContact'),
  mutableEncoded(
    Schema.Struct({
      relationship: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      name: Schema.optional(
        Schema.suspend(() => FhirR4HumanName.EncodedFromExternal)
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)
          )
        )
      ),
      address: Schema.optional(
        Schema.suspend(() => FhirR4Address.EncodedFromExternal)
      ),
      gender: Schema.optional(AdministrativeGender),
      organization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      period: Schema.optional(
        Schema.suspend(() => FhirR4Period.EncodedFromExternal)
      ),
    })
  )
)
