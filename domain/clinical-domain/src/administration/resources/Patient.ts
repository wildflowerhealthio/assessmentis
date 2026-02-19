import type { DateTime } from 'effect'
import { pipe, Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { HumanName } from '../../data-types/complex/HumanName'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import { Address } from '../../data-types/complex/Address'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Period } from '../../data-types/complex/Period'
import { AdministrativeGender } from '../value-sets/AdministrativeGender'
import { TimelessDateFromString, WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Patient'
)
type ResourceSymbol = typeof ResourceSymbol

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

export interface PatientContact extends BackboneElement<PatientContactId> {
  relationship?: CodeableConcept[]
  name?: HumanName
  telecom?: ContactPoint[]
  address?: Address
  gender?: AdministrativeGender
  organization?: Reference
  period?: Period
}

export interface PatientCommunication extends BackboneElement<PatientCommunicationId> {
  language: CodeableConcept
  preferred?: boolean
}

export interface PatientLink extends BackboneElement<PatientLinkId> {
  other: Reference
  type: PatientLinkType
}

// --- Sub-component schemas ---

const PatientContactSchema = Schema.extend(
  BackboneElement.Schema(PatientContactId),
  Schema.Struct({
    relationship: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    name: Schema.optional(Schema.suspend(() => HumanName.Schema)),
    telecom: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ContactPoint.Schema)))
    ),
    address: Schema.optional(Schema.suspend(() => Address.Schema)),
    gender: Schema.optional(AdministrativeGender),
    organization: Schema.optional(Schema.suspend(() => Reference.Schema)),
    period: Schema.optional(Schema.suspend(() => Period.Schema)),
  })
)

const PatientCommunicationSchema = Schema.extend(
  BackboneElement.Schema(PatientCommunicationId),
  Schema.Struct({
    language: Schema.suspend(() => CodeableConcept.Schema),
    preferred: Schema.optional(Schema.Boolean),
  })
)

const PatientLinkSchema = Schema.extend(
  BackboneElement.Schema(PatientLinkId),
  Schema.Struct({
    other: Schema.suspend(() => Reference.Schema),
    type: PatientLinkType,
  })
)

// --- Patient ---

/**
 * Demographics and other administrative information about an individual or animal
 * receiving care or other health-related services.
 */
export interface Patient
  extends
    DomainResource<PatientId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
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

const PatientSchema = pipe(
  DomainResource.Schema(PatientId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Patient'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
      ),
      active: Schema.optional(Schema.Boolean),
      name: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => HumanName.Schema)))
      ),
      telecom: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ContactPoint.Schema)))
      ),
      gender: Schema.optional(AdministrativeGender),
      birthDate: Schema.optional(TimelessDateFromString),
      deceasedBoolean: Schema.optional(Schema.Boolean),
      deceasedDateTime: Schema.optional(Schema.DateTimeUtc),
      address: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Address.Schema)))
      ),
      maritalStatus: Schema.optional(
        Schema.suspend(() => CodeableConcept.Schema)
      ),
      multipleBirthBoolean: Schema.optional(Schema.Boolean),
      multipleBirthInteger: Schema.optional(Schema.Number),
      photo: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Attachment.Schema)))
      ),
      contact: Schema.optional(
        Schema.mutable(Schema.Array(PatientContactSchema))
      ),
      communication: Schema.optional(
        Schema.mutable(Schema.Array(PatientCommunicationSchema))
      ),
      generalPractitioner: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      managingOrganization: Schema.optional(
        Schema.suspend(() => Reference.Schema)
      ),
      link: Schema.optional(Schema.mutable(Schema.Array(PatientLinkSchema))),
    })
  )
)

type PatientEncoded = Schema.Schema.Encoded<typeof PatientSchema>

/**
 * Schema for transforming between Patient Data objects and FHIR R4 Patient resources.
 */
export const Patient = ClinicalResourceBehaviourImpl<Patient, PatientEncoded>({
  ResourceSymbol: ResourceSymbol,
  resourceType: 'Patient',
  Schema: PatientSchema,
})
