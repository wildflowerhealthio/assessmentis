import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  Patient,
  type PatientEncoded,
  PatientLinkType,
} from '@assessmentis/clinical-domain'
import { AdministrativeGender } from '@assessmentis/clinical-domain/data-types'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanNameEncodedFromFhir } from '../../data-types/complex/HumanName'
import { ContactPointEncodedFromFhir } from '../../data-types/complex/ContactPoint'
import { AddressEncodedFromFhir } from '../../data-types/complex/Address'
import { AttachmentEncodedFromFhir } from '../../data-types/complex/Attachment'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

// --- Sub-component schemas ---

const PatientContactEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientContact'),
  mutableEncoded(
    Schema.Struct({
      relationship: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      name: Schema.optional(Schema.suspend(() => HumanNameEncodedFromFhir)),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ContactPointEncodedFromFhir))
        )
      ),
      address: Schema.optional(Schema.suspend(() => AddressEncodedFromFhir)),
      gender: Schema.optional(AdministrativeGender.AdministrativeGender),
      organization: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
    })
  )
)

const PatientCommunicationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientCommunication'),
  mutableEncoded(
    Schema.Struct({
      language: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      preferred: Schema.optional(Schema.Boolean),
    })
  )
)

const PatientLinkEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientLink'),
  mutableEncoded(
    Schema.Struct({
      other: Schema.suspend(() => ReferenceEncodedFromFhir),
      type: PatientLinkType,
    })
  )
)

// --- Patient ---

const FhirR4PatientEncodedFromFhir: Schema.Schema<
  PatientEncoded,
  FhirR4.Patient,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('Patient', 'Patient'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      active: Schema.optional(Schema.Boolean),
      name: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => HumanNameEncodedFromFhir))
        )
      ),
      telecom: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ContactPointEncodedFromFhir))
        )
      ),
      gender: Schema.optional(AdministrativeGender.AdministrativeGender),
      birthDate: Schema.optional(Schema.String),
      deceasedBoolean: Schema.optional(Schema.Boolean),
      deceasedDateTime: Schema.optional(Schema.String),
      address: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AddressEncodedFromFhir))
        )
      ),
      maritalStatus: Schema.optional(
        Schema.suspend(() => CodeableConceptEncodedFromFhir)
      ),
      multipleBirthBoolean: Schema.optional(Schema.Boolean),
      multipleBirthInteger: Schema.optional(Schema.Number),
      photo: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AttachmentEncodedFromFhir))
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
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      link: Schema.optional(
        mutableEncoded(Schema.Array(PatientLinkEncodedFromFhir))
      ),
    })
  )
)

export const FhirR4Patient = {
  resourceType: 'Patient',
  Schema: Schema.compose(FhirR4PatientEncodedFromFhir, Patient),
}
