import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { Patient, type PatientEncoded } from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4HumanName } from '../../data-types/complex/HumanName'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { PatientContactEncodedFromFhir } from './PatientContact'
import { PatientCommunicationEncodedFromFhir } from './PatientCommunication'
import { PatientLinkEncodedFromFhir } from './PatientLink'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<PatientEncoded, FhirR4.Patient, BaseUrl> =
  Schema.extend(
    ResourceEncodedFromFhirR4Resource('Patient', 'Patient'),
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
        gender: Schema.optional(AdministrativeGender.AdministrativeGender),
        birthDate: Schema.optional(Schema.String),
        deceasedBoolean: Schema.optional(Schema.Boolean),
        deceasedDateTime: Schema.optional(Schema.String),
        address: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Address.EncodedFromExternal)
            )
          )
        ),
        maritalStatus: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        multipleBirthBoolean: Schema.optional(Schema.Boolean),
        multipleBirthInteger: Schema.optional(Schema.Number),
        photo: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Attachment.EncodedFromExternal)
            )
          )
        ),
        contact: Schema.optional(
          mutableEncoded(Schema.Array(PatientContactEncodedFromFhir))
        ),
        communication: Schema.optional(
          mutableEncoded(Schema.Array(PatientCommunicationEncodedFromFhir))
        ),
        generalPractitioner: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
            )
          )
        ),
        managingOrganization: Schema.optional(
          Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
        ),
        link: Schema.optional(
          mutableEncoded(Schema.Array(PatientLinkEncodedFromFhir))
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
