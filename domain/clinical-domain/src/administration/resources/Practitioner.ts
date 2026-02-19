import { pipe, Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { DomainResource } from '../../data-types/base/DomainResource'
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
  '@assessmentis/clinical-domain/Practitioner'
)
type ResourceSymbol = typeof ResourceSymbol

export const PractitionerId = Schema.String.pipe(Schema.brand('PractitionerId'))

export type PractitionerId = typeof PractitionerId.Type

// --- Sub-component ---

const PractitionerQualificationId = Schema.String.pipe(
  Schema.brand('PractitionerQualificationId')
)
type PractitionerQualificationId = typeof PractitionerQualificationId.Type

export interface PractitionerQualification extends BackboneElement<PractitionerQualificationId> {
  identifier?: Identifier[]
  code: CodeableConcept
  period?: Period
  issuer?: Reference
}

const PractitionerQualificationSchema = Schema.extend(
  BackboneElement.Schema(PractitionerQualificationId),
  Schema.Struct({
    identifier: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
    ),
    code: Schema.suspend(() => CodeableConcept.Schema),
    period: Schema.optional(Schema.suspend(() => Period.Schema)),
    issuer: Schema.optional(Schema.suspend(() => Reference.Schema)),
  })
)

// --- Practitioner ---

/**
 * A person who is directly or indirectly involved in the provisioning of healthcare.
 */
export interface Practitioner
  extends
    DomainResource<PractitionerId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
  resourceType: 'Practitioner'
  identifier?: Identifier[]
  active?: boolean
  name?: HumanName[]
  telecom?: ContactPoint[]
  address?: Address[]
  gender?: AdministrativeGender
  birthDate?: Date
  photo?: Attachment[]
  qualification?: PractitionerQualification[]
  communication?: CodeableConcept[]
}

const PractitionerSchema = pipe(
  DomainResource.Schema(PractitionerId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Practitioner'),
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
      address: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Address.Schema)))
      ),
      gender: Schema.optional(AdministrativeGender),
      birthDate: Schema.optional(TimelessDateFromString),
      photo: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Attachment.Schema)))
      ),
      qualification: Schema.optional(
        Schema.mutable(Schema.Array(PractitionerQualificationSchema))
      ),
      communication: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
    })
  )
)

type PractitionerEncoded = Schema.Schema.Encoded<typeof PractitionerSchema>

/**
 * Schema for transforming between Practitioner Data objects and FHIR R4 Practitioner resources.
 */
export const Practitioner = ClinicalResourceBehaviourImpl<
  Practitioner,
  PractitionerEncoded
>({
  ResourceSymbol,
  resourceType: 'Practitioner',
  Schema: PractitionerSchema,
})
