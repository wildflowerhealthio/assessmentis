import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type {
  Patient as FhirPatient,
  PatientContact as FhirPatientContact,
  PatientCommunication as FhirPatientCommunication,
  PatientLink as FhirPatientLink,
} from 'fhir/r4'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanName } from '../../data-types/complex/HumanName'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { Address } from '../../data-types/complex/Address'
import type { Attachment } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString, type DeepReadonly } from '@assessmentis/util'

export const PatientId = Schema.String.pipe(Schema.brand('PatientId'))

export type PatientId = typeof PatientId.Type

/**
 * This element is labeled as a modifier because it may be used to mark that the
 * resource was created in error.
 */
export const PatientLinkType = Schema.Enums({
  'replaced-by': 'replaced-by',
  replaces: 'replaces',
  refer: 'refer',
  seealso: 'seealso',
} as const)

export type PatientLinkType = typeof PatientLinkType.Type

// --- Sub-component IDs ---

const PatientContactId = Schema.String.pipe(Schema.brand('PatientContactId'))
type PatientContactId = typeof PatientContactId.Type

const PatientCommunicationId = Schema.String.pipe(
  Schema.brand('PatientCommunicationId')
)
type PatientCommunicationId = typeof PatientCommunicationId.Type

const PatientLinkId = Schema.String.pipe(Schema.brand('PatientLinkId'))
type PatientLinkId = typeof PatientLinkId.Type

// --- Sub-component interfaces ---

interface PatientContact extends BackboneElement<PatientContactId> {
  relationship?: ReadonlyArray<CodeableConcept>
  name?: HumanName
  telecom?: ReadonlyArray<ContactPoint>
  address?: Address
  gender?: AdministrativeGender
  organization?: Reference
  period?: Period
}

interface PatientCommunication extends BackboneElement<PatientCommunicationId> {
  language: CodeableConcept
  preferred?: boolean
}

interface PatientLink extends BackboneElement<PatientLinkId> {
  other: Reference
  type: PatientLinkType
}

// --- Sub-component schemas ---

const PatientContactFromFhirR4: Schema.Schema<
  PatientContact,
  DeepReadonly<FhirPatientContact>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PatientContactId),
  Schema.Struct({
    relationship: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    name: Schema.optional(Schema.suspend(() => HumanName)),
    telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
    address: Schema.optional(Schema.suspend(() => Address)),
    gender: Schema.optional(AdministrativeGender),
    organization: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
  })
)

const PatientCommunicationFromFhirR4: Schema.Schema<
  PatientCommunication,
  DeepReadonly<FhirPatientCommunication>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PatientCommunicationId),
  Schema.Struct({
    language: Schema.suspend(() => CodeableConceptFromFhirR4),
    preferred: Schema.optional(Schema.Boolean),
  })
)

const PatientLinkFromFhirR4: Schema.Schema<
  PatientLink,
  DeepReadonly<FhirPatientLink>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PatientLinkId),
  Schema.Struct({
    other: Schema.suspend(() => ReferenceFromFhirR4),
    type: PatientLinkType,
  })
)

// --- Patient ---

/**
 * Demographics and other administrative information about an individual or animal
 * receiving care or other health-related services.
 */
export interface Patient extends DomainResource<PatientId> {
  resourceType: 'Patient'
  identifier?: ReadonlyArray<Identifier>
  active?: boolean
  name?: ReadonlyArray<HumanName>
  telecom?: ReadonlyArray<ContactPoint>
  gender?: AdministrativeGender
  birthDate?: Date
  deceasedBoolean?: boolean
  deceasedDateTime?: DateTime.Utc
  address?: ReadonlyArray<Address>
  maritalStatus?: CodeableConcept
  multipleBirthBoolean?: boolean
  multipleBirthInteger?: number
  photo?: ReadonlyArray<Attachment>
  contact?: ReadonlyArray<PatientContact>
  communication?: ReadonlyArray<PatientCommunication>
  generalPractitioner?: ReadonlyArray<Reference>
  managingOrganization?: Reference
  link?: ReadonlyArray<PatientLink>
}

/**
 * Schema for transforming between Patient Data objects and FHIR R4 Patient resources.
 */
export const PatientFromFhirR4: Schema.Schema<
  Patient,
  DeepReadonly<FhirPatient>,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(PatientId),
  Schema.Struct({
    resourceType: Schema.Literal('Patient'),
    identifier: Schema.optional(
      Schema.Array(Schema.suspend(() => IdentifierFromFhirR4))
    ),
    active: Schema.optional(Schema.Boolean),
    name: Schema.optional(Schema.Array(Schema.suspend(() => HumanName))),
    telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
    gender: Schema.optional(AdministrativeGender),
    birthDate: Schema.optional(TimelessDateFromString),
    deceasedBoolean: Schema.optional(Schema.Boolean),
    deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
    address: Schema.optional(Schema.Array(Schema.suspend(() => Address))),
    maritalStatus: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    multipleBirthBoolean: Schema.optional(Schema.Boolean),
    multipleBirthInteger: Schema.optional(Schema.Number),
    photo: Schema.optional(
      Schema.Array(Schema.suspend(() => AttachmentFromFhirR4))
    ),
    contact: Schema.optional(Schema.Array(PatientContactFromFhirR4)),
    communication: Schema.optional(
      Schema.Array(PatientCommunicationFromFhirR4)
    ),
    generalPractitioner: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    managingOrganization: Schema.optional(
      Schema.suspend(() => ReferenceFromFhirR4)
    ),
    link: Schema.optional(Schema.Array(PatientLinkFromFhirR4)),
  })
)
