import { Schema } from 'effect'

import {
  Practitioner,
  type PractitionerEncoded,
} from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import { FhirR4HumanName } from '../../data-types/complex/HumanName'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { PractitionerQualificationEncodedFromFhir } from './PractitionerQualification'

const EncodedFromFhir: Schema.Schema<
  PractitionerEncoded,
  FhirR4.Practitioner,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Practitioner', 'Practitioner'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
          )
        )
      ),
      active: Schema.optional(Schema.Boolean),
      name: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4HumanName.EncodedFromExternal)
          )
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)
          )
        )
      ),
      address: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4Address.EncodedFromExternal))
        )
      ),
      gender: Schema.optional(AdministrativeGender),
      birthDate: Schema.optional(Schema.String),
      photo: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)
          )
        )
      ),
      qualification: Schema.optional(
        mutableEncoded(Schema.Array(PractitionerQualificationEncodedFromFhir))
      ),
      communication: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
    })
  )
)

export const FhirR4Practitioner = new TwoStepExternalSchema<
  Practitioner,
  PractitionerEncoded,
  FhirR4.Practitioner,
  BaseUrl
>(Practitioner, EncodedFromFhir)
