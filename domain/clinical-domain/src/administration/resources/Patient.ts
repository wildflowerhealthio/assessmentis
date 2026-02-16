import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
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
import {
  ContactPointFromFhirR4,
  type ContactPoint,
} from '../../data-types/complex/ContactPoint'
import {
  AddressFromFhirR4,
  type Address,
} from '../../data-types/complex/Address'
import type { Attachment } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString } from '@assessmentis/util'

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
  relationship?: CodeableConcept[]
  name?: HumanName
  telecom?: ContactPoint[]
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
  fhir.PatientContact,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(PatientContactId),
  Schema.Struct({
    relationship: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
      )
    ),
    name: Schema.optional(Schema.suspend(() => HumanName)),
    telecom: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => ContactPointFromFhirR4))
      )
    ),
    address: Schema.optional(Schema.suspend(() => AddressFromFhirR4)),
    gender: Schema.optional(AdministrativeGender),
    organization: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
  })
)

const PatientCommunicationFromFhirR4: Schema.Schema<
  PatientCommunication,
  fhir.PatientCommunication,
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
  fhir.PatientLink,
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
  identifier?: Identifier[]
  active?: boolean
  name?: HumanName[]
  telecom?: ContactPoint[]
  gender?: AdministrativeGender
  birthDate?: Date
  deceasedBoolean?: boolean
  deceasedDateTime?: DateTime.Utc
  address?: Address[]
  maritalStatus?: CodeableConcept
  multipleBirthBoolean?: boolean
  multipleBirthInteger?: number
  photo?: Attachment[]
  contact?: PatientContact[]
  communication?: PatientCommunication[]
  generalPractitioner?: Reference[]
  managingOrganization?: Reference
  link?: PatientLink[]
}

/**
 * Schema for transforming between Patient Data objects and FHIR R4 Patient resources.
 */
export const PatientFromFhirR4: Schema.Schema<
  Patient,
  fhir.Patient,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(PatientId),
  Schema.Struct({
    resourceType: Schema.Literal('Patient'),
    identifier: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => IdentifierFromFhirR4))
      )
    ),
    active: Schema.optional(Schema.Boolean),
    name: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => HumanName)))
    ),
    telecom: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => ContactPointFromFhirR4))
      )
    ),
    gender: Schema.optional(AdministrativeGender),
    birthDate: Schema.optional(TimelessDateFromString),
    deceasedBoolean: Schema.optional(Schema.Boolean),
    deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
    address: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => AddressFromFhirR4))
      )
    ),
    maritalStatus: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    multipleBirthBoolean: Schema.optional(Schema.Boolean),
    multipleBirthInteger: Schema.optional(Schema.Number),
    photo: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => AttachmentFromFhirR4))
      )
    ),
    contact: Schema.optional(
      Schema.mutable(Schema.Array(PatientContactFromFhirR4))
    ),
    communication: Schema.optional(
      Schema.mutable(Schema.Array(PatientCommunicationFromFhirR4))
    ),
    generalPractitioner: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
      )
    ),
    managingOrganization: Schema.optional(
      Schema.suspend(() => ReferenceFromFhirR4)
    ),
    link: Schema.optional(
      Schema.mutable(Schema.Array(PatientLinkFromFhirR4))
    ),
  })
)
