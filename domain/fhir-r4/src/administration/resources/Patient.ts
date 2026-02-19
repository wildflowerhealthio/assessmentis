import { pipe, Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {} from '../../FhirR4ResourceBehaviour'
import {
  Patient,
  type PatientContact,
  type PatientCommunication,
  type PatientLink,
} from '@assessmentis/clinical-domain/administration'
import {
  PatientId,
  PatientLinkType,
  AdministrativeGender,
} from '@assessmentis/clinical-domain/administration'
import { TimelessDateFromString, WithSymbolTag } from '@assessmentis/util'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4HumanName } from '../../data-types/complex/HumanName'
import { FhirR4ContactPoint } from '../../data-types/complex/ContactPoint'
import { FhirR4Address } from '../../data-types/complex/Address'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Period } from '../../data-types/complex/Period'
import { Resource } from '@assessmentis/effectful-store'

// --- Sub-component IDs ---

const PatientContactId = Schema.String.pipe(Schema.brand('PatientContactId'))

const PatientCommunicationId = Schema.String.pipe(
  Schema.brand('PatientCommunicationId')
)

const PatientLinkId = Schema.String.pipe(Schema.brand('PatientLinkId'))

// --- Sub-component schemas ---

const FhirR4PatientContactSchema: Schema.Schema<
  PatientContact,
  FhirR4.PatientContact,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(PatientContactId),
  Schema.Struct({
    relationship: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    name: Schema.optional(Schema.suspend(() => FhirR4HumanName.Schema)),
    telecom: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4ContactPoint.Schema))
      )
    ),
    address: Schema.optional(Schema.suspend(() => FhirR4Address.Schema)),
    gender: Schema.optional(AdministrativeGender),
    organization: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
  })
)

const FhirR4PatientCommunicationSchema: Schema.Schema<
  PatientCommunication,
  FhirR4.PatientCommunication,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(PatientCommunicationId),
  Schema.Struct({
    language: Schema.suspend(() => FhirR4CodeableConcept.Schema),
    preferred: Schema.optional(Schema.Boolean),
  })
)

const FhirR4PatientLinkSchema: Schema.Schema<
  PatientLink,
  FhirR4.PatientLink,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(PatientLinkId),
  Schema.Struct({
    other: Schema.suspend(() => FhirR4Reference.Schema),
    type: PatientLinkType,
  })
)

// --- Patient ---

const FhirR4PatientSchema: Schema.Schema<Patient, FhirR4.Patient, never> = pipe(
  FhirR4DomainResource.Schema(PatientId),
  WithSymbolTag(Resource.ResourceType, Patient[Resource.ResourceType]),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Patient'),
      identifier: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
        )
      ),
      active: Schema.optional(Schema.Boolean),
      name: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4HumanName.Schema))
        )
      ),
      telecom: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4ContactPoint.Schema))
        )
      ),
      gender: Schema.optional(AdministrativeGender),
      birthDate: Schema.optional(TimelessDateFromString),
      deceasedBoolean: Schema.optional(Schema.Boolean),
      deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
      address: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Address.Schema)))
      ),
      maritalStatus: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      multipleBirthBoolean: Schema.optional(Schema.Boolean),
      multipleBirthInteger: Schema.optional(Schema.Number),
      photo: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Attachment.Schema))
        )
      ),
      contact: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4PatientContactSchema))
      ),
      communication: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4PatientCommunicationSchema))
      ),
      generalPractitioner: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => FhirR4Reference.Schema)
      ),
      link: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4PatientLinkSchema))
      ),
    })
  )
)

export const FhirR4Patient = {
  resourceType: 'Patient',
  Schema: FhirR4PatientSchema,
}
