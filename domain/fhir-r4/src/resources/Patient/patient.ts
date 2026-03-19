import { Schema } from 'effect'

import { Patient } from '@assessmentis/clinical-domain'
import type { PatientEncoded } from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Address } from '../../data-types/complex/address'
import { FhirR4Attachment } from '../../data-types/complex/attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4ContactPoint } from '../../data-types/complex/contact-point'
import { FhirR4HumanName } from '../../data-types/complex/human-name'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'
import { PatientCommunicationEncodedFromFhir } from './patient-communication'
import { PatientContactEncodedFromFhir } from './patient-contact'
import { PatientLinkEncodedFromFhir } from './patient-link'

const EncodedFromFhir: Schema.Schema<PatientEncoded, FhirR4.Patient, BaseUrl> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Patient', 'Patient'),
  mutableEncoded(
    Schema.Struct({
      active: Schema.optional(Schema.Boolean),
      address: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Address.EncodedFromExternal)))
      ),
      birthDate: Schema.optional(Schema.String),
      communication: Schema.optional(
        mutableEncoded(Schema.Array(PatientCommunicationEncodedFromFhir))
      ),
      contact: Schema.optional(mutableEncoded(Schema.Array(PatientContactEncodedFromFhir))),
      deceasedBoolean: Schema.optional(Schema.Boolean),
      deceasedDateTime: Schema.optional(Schema.String),
      gender: Schema.optional(AdministrativeGender),
      generalPractitioner: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      identifier: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
      ),
      link: Schema.optional(mutableEncoded(Schema.Array(PatientLinkEncodedFromFhir))),
      managingOrganization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      maritalStatus: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      multipleBirthBoolean: Schema.optional(Schema.Boolean),
      multipleBirthInteger: Schema.optional(Schema.Int),
      name: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4HumanName.EncodedFromExternal)))
      ),
      photo: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)))
      ),
      telecom: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4ContactPoint.EncodedFromExternal)))
      ),
    })
  )
)

export const FhirR4Patient = new TwoStepExternalSchema<
  Patient,
  PatientEncoded,
  FhirR4.Patient,
  BaseUrl
>(Patient, EncodedFromFhir)
